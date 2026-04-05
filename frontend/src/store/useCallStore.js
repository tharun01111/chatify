import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";

const formatDuration = (durationInSeconds) => {
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = durationInSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const useCallStore = create((set, get) => ({
  callStatus: "idle",
  callType: null,
  incomingCallData: null,
  currentCallId: null,
  activePeerId: null,
  callStartedAt: null,
  hasLoggedCurrentCall: false,

  resetCallState: () => {
    const peerId = get().activePeerId;
    if (peerId) {
      useChatStore.getState().removeTemporaryCallLog(peerId);
    }

    set({
      callStatus: "idle",
      callType: null,
      incomingCallData: null,
      currentCallId: null,
      activePeerId: null,
      callStartedAt: null,
      hasLoggedCurrentCall: false,
    });
  },

  startOutgoingCall: ({ callId, targetUserId, callType = "video" }) => {
    const peerUser = useChatStore.getState().findUserById(targetUserId);

    useChatStore.getState().upsertTemporaryCallLog({
      peerUser,
      callType,
      direction: "outgoing",
      text: "Calling video call...",
    });

    set({
      callStatus: "calling",
      callType,
      incomingCallData: null,
      currentCallId: callId,
      activePeerId: targetUserId,
      callStartedAt: null,
      hasLoggedCurrentCall: false,
    });
  },

  acceptCall: () => {
    const { incomingCallData } = get();
    set({
      callStatus: "in-call",
      callType: "video",
      incomingCallData: null,
      currentCallId: incomingCallData?.callId || null,
      activePeerId: incomingCallData?.callerId || null,
      callStartedAt: null,
    });
  },

  markCallActive: ({ callId, peerId, callType = "video" }) => {
    set({
      callStatus: "in-call",
      callType,
      currentCallId: callId,
      activePeerId: peerId,
      callStartedAt: get().callStartedAt || Date.now(),
    });
  },

  persistCallLog: async ({ peerId, text, callDuration = 0 }) => {
    const {
      callType,
      hasLoggedCurrentCall,
      activePeerId,
      callStatus,
    } = get();

    const resolvedPeerId = peerId || activePeerId;
    if (!resolvedPeerId || hasLoggedCurrentCall || callStatus === "idle") return;

    try {
      const res = await axiosInstance.post(`/message/send/${resolvedPeerId}`, {
        text,
        messageType: "call",
        callDuration,
        callType: callType || "video",
      });

      useChatStore.getState().upsertCallLog(res.data);
      useChatStore.getState().appendMessageIfRelevant(res.data);
      useChatStore.getState().removeTemporaryCallLog(resolvedPeerId);
      set({ hasLoggedCurrentCall: true });
    } catch (error) {
      console.error("Failed to persist call log:", error);
    }
  },

  finalizeCallLog: async ({ reason, peerId } = {}) => {
    const {
      callStartedAt,
      callStatus,
      activePeerId,
      persistCallLog,
    } = get();

    const resolvedPeerId = peerId || activePeerId;
    if (!resolvedPeerId || callStatus === "idle") return;

    if (reason === "ended" && callStartedAt) {
      const durationInSeconds = Math.max(
        1,
        Math.floor((Date.now() - callStartedAt) / 1000),
      );

      await persistCallLog({
        peerId: resolvedPeerId,
        text: `Video call ended - ${formatDuration(durationInSeconds)}`,
        callDuration: durationInSeconds,
      });
      return;
    }

    if (reason === "declined") {
      await persistCallLog({
        peerId: resolvedPeerId,
        text: "Declined video call",
      });
      return;
    }

    if (reason === "missed") {
      await persistCallLog({
        peerId: resolvedPeerId,
        text: "Missed video call",
      });
      return;
    }

    if (reason === "unavailable") {
      await persistCallLog({
        peerId: resolvedPeerId,
        text: "User was offline for video call",
      });
      return;
    }

    if (reason === "interrupted") {
      await persistCallLog({
        peerId: resolvedPeerId,
        text: "Video call ended unexpectedly",
      });
    }
  },

  rejectCall: (reason = "declined") => {
    const socket = useAuthStore.getState().socket;
    const { incomingCallData } = get();

    if (socket && incomingCallData?.callerId) {
      socket.emit("call_reject", {
        targetUserId: incomingCallData.callerId,
        reason,
      });
    }

    void get().finalizeCallLog({
      peerId: incomingCallData?.callerId,
      reason: "declined",
    });
    get().resetCallState();
  },

  listenToCallEvents: (socket) => {
    socket.on("call_incoming", (data) => {
      const { callStatus } = get();

      if (callStatus !== "idle") {
        socket.emit("call_busy", { targetUserId: data.callerId });
        return;
      }

      const peerUser = useChatStore.getState().findUserById(data.callerId);
      useChatStore.getState().upsertTemporaryCallLog({
        peerUser,
        callType: "video",
        direction: "incoming",
        text: "Incoming video call...",
      });

      set({
        callStatus: "ringing",
        callType: "video",
        incomingCallData: data,
        currentCallId: data.callId,
        activePeerId: data.callerId,
        callStartedAt: null,
        hasLoggedCurrentCall: false,
      });
    });

    socket.on("call_failed_offline", () => {
      toast.error("User is offline");
      void get().finalizeCallLog({ reason: "unavailable" });
      get().resetCallState();
    });

    socket.on("call_rejected", (data) => {
      toast(data.reason === "busy" ? "User is busy" : "Call declined");
      useChatStore
        .getState()
        .removeTemporaryCallLog(get().activePeerId || data.calleeId);
      get().resetCallState();
    });

    socket.on("call_ended", () => {
      toast("Call ended");
      useChatStore.getState().removeTemporaryCallLog(get().activePeerId);
      get().resetCallState();
    });

    socket.on("call_ended_abruptly", () => {
      toast.error("Call ended unexpectedly");
      void get().finalizeCallLog({ reason: "interrupted" });
      get().resetCallState();
    });
  },

  unlistenCallEvents: (socket) => {
    socket.off("call_incoming");
    socket.off("call_failed_offline");
    socket.off("call_rejected");
    socket.off("call_ended");
    socket.off("call_ended_abruptly");
    get().resetCallState();
  },
}));
