import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import {
  createPeerConnection,
  destroyMediaStream,
  getMediaStream,
} from "../lib/webrtc";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";

let rtcTimeout = null;

const clearRtcTimeout = () => {
  clearTimeout(rtcTimeout);
  rtcTimeout = null;
};

const formatCallLabel = (callType) =>
  callType === "video" ? "Video Call" : "Voice Call";

const getPeerUserFromIncomingCallData = (incomingCallData) => {
  if (!incomingCallData?.callerId) return null;

  return {
    _id: incomingCallData.callerId,
    fullName: incomingCallData.callerName || "User",
    profilePic: incomingCallData.profilePic || "",
  };
};

export const useCallStore = create((set, get) => ({
  callStatus: "idle",
  callType: null,
  incomingCallData: null,
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  videoUpgradeStatus: "idle",
  isCaller: false,
  callStartTime: null,

  initiateCall: async (targetUser, type) => {
    const socket = useAuthStore.getState().socket;

    if (!socket) {
      toast.error("Realtime connection is not ready yet.");
      return;
    }

    try {
      const stream = await getMediaStream(type);

      set({
        localStream: stream,
        callStatus: "calling",
        callType: type,
        isCaller: true,
        callStartTime: null,
        incomingCallData: {
          callerId: targetUser._id,
          callerName: targetUser.fullName,
          profilePic: targetUser.profilePic,
        },
      });

      useChatStore.getState().upsertTemporaryCallLog({
        peerUser: targetUser,
        callType: type,
        direction: "outgoing",
        text: `Calling ${formatCallLabel(type)}...`,
      });

      socket.emit("call_request", {
        targetUserId: targetUser._id,
        callType: type,
      });

      clearRtcTimeout();
      rtcTimeout = setTimeout(() => {
        socket.emit("call_timeout", { targetUserId: targetUser._id });
        get().endCall(false);
        toast.error("User did not answer");
      }, 30000);
    } catch (error) {
      toast.error(error.message);
      get().resetState();
    }
  },

  answerCall: async () => {
    const { incomingCallData, callType } = get();

    try {
      const stream = await getMediaStream(callType);
      const socket = useAuthStore.getState().socket;

      if (!socket || !incomingCallData?.callerId) {
        destroyMediaStream(stream);
        get().resetState();
        return;
      }

      socket.emit("call_accept", { targetUserId: incomingCallData.callerId });

      set({
        localStream: stream,
        callStatus: "active",
        isCaller: false,
        callStartTime: Date.now(),
      });

      useChatStore.getState().upsertTemporaryCallLog({
        peerUser: getPeerUserFromIncomingCallData(incomingCallData),
        callType,
        direction: "incoming",
        text: "In call",
      });
    } catch (error) {
      toast.error(error.message);
      get().rejectCall("media_failure");
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

    useChatStore
      .getState()
      .removeTemporaryCallLog(incomingCallData?.callerId);

    get().resetState();
  },

  endCall: (notifyPeer = true) => {
    const socket = useAuthStore.getState().socket;
    const { incomingCallData, callStatus } = get();
    const targetUserId = incomingCallData?.callerId;

    if (targetUserId && callStatus !== "idle") {
      if (callStatus === "active") get().sendLog("ended");
      else if (callStatus === "calling") get().sendLog("missed");

      if (notifyPeer && socket) {
        socket.emit("call_end", { targetUserId });
      }
    }

    get().resetState();
  },

  sendLog: async (reason) => {
    const { isCaller, incomingCallData, callType, callStartTime } = get();
    if (!isCaller || !incomingCallData?.callerId) return;

    const targetUserId = incomingCallData.callerId;
    let text = "";
    let callDuration = 0;

    if (reason === "missed") text = `Missed ${callType} Call`;
    else if (reason === "rejected") text = `Declined ${callType} Call`;
    else if (reason === "ended" && callStartTime) {
      callDuration = Math.floor((Date.now() - callStartTime) / 1000);
      const m = Math.floor(callDuration / 60);
      const s = callDuration % 60;
      text = `${
        callType === "video" ? "Video" : "Voice"
      } Call ended - ${m}:${s.toString().padStart(2, "0")}`;
    } else {
      text = `${callType === "video" ? "Video" : "Voice"} Call ended`;
    }

    try {
      const createdMessage = await axiosInstance.post(`/message/send/${targetUserId}`, {
        text,
        messageType: "call",
        callDuration,
        callType,
      });
      useChatStore.getState().upsertCallLog(createdMessage.data);
      useChatStore.getState().appendMessageIfRelevant(createdMessage.data);
    } catch (error) {
      console.error("Failed to store call log", error);
    }
  },

  requestVideoUpgrade: () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCallData, callType } = get();

    if (!socket || !incomingCallData?.callerId || callType !== "audio") return;

    socket.emit("video_upgrade_request", {
      targetUserId: incomingCallData.callerId,
    });
    set({ videoUpgradeStatus: "requesting" });
  },

  acceptVideoUpgrade: async () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCallData, peerConnection, localStream } = get();

    if (!socket || !incomingCallData?.callerId || !localStream) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const videoTrack = stream.getVideoTracks()[0];

      if (!videoTrack) throw new Error("No video track available");

      localStream.addTrack(videoTrack);
      if (peerConnection) {
        peerConnection.addTrack(videoTrack, localStream);
      }

      set({ callType: "video", videoUpgradeStatus: "idle" });
      socket.emit("video_upgrade_accept", {
        targetUserId: incomingCallData.callerId,
      });

      if (peerConnection) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("webrtc_signal", {
          to: incomingCallData.callerId,
          signal: { type: "offer", sdp: peerConnection.localDescription },
        });
      }
    } catch {
      toast.error("Camera access denied.");
      socket.emit("video_upgrade_reject", {
        targetUserId: incomingCallData.callerId,
      });
      set({ videoUpgradeStatus: "idle" });
    }
  },

  rejectVideoUpgrade: () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCallData } = get();

    if (socket && incomingCallData?.callerId) {
      socket.emit("video_upgrade_reject", {
        targetUserId: incomingCallData.callerId,
      });
    }

    set({ videoUpgradeStatus: "idle" });
  },

  resetState: () => {
    clearRtcTimeout();

    const { localStream, remoteStream, peerConnection } = get();

    destroyMediaStream(localStream);
    destroyMediaStream(remoteStream);

    if (peerConnection) {
      peerConnection.close();
    }

    set({
      callStatus: "idle",
      callType: null,
      incomingCallData: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      videoUpgradeStatus: "idle",
      isCaller: false,
      callStartTime: null,
    });
  },

  listenToCallEvents: (socket) => {
    socket.on("call_incoming", (data) => {
      const { callStatus } = get();

      if (callStatus !== "idle") {
        socket.emit("call_busy", { targetUserId: data.callerId });
        return;
      }

      set({
        callStatus: "ringing",
        callType: data.callType,
        incomingCallData: data,
      });

      useChatStore.getState().upsertTemporaryCallLog({
        peerUser: getPeerUserFromIncomingCallData(data),
        callType: data.callType,
        direction: "incoming",
        text: `Incoming ${formatCallLabel(data.callType)}`,
      });
    });

    socket.on("call_failed_offline", () => {
      toast.error("User is offline");
      useChatStore
        .getState()
        .removeTemporaryCallLog(get().incomingCallData?.callerId);
      get().resetState();
    });

    socket.on("call_accepted", async () => {
      clearRtcTimeout();
      set({ callStatus: "active", callStartTime: Date.now() });

      const { localStream, incomingCallData } = get();
      const targetUserId = incomingCallData?.callerId;

      if (!localStream || !targetUserId) {
        get().resetState();
        return;
      }

      useChatStore.getState().upsertTemporaryCallLog({
        peerUser: {
          _id: targetUserId,
          fullName: incomingCallData.callerName || "User",
          profilePic: incomingCallData.profilePic || "",
        },
        callType: get().callType,
        direction: "outgoing",
        text: "In call",
      });

      const pc = createPeerConnection();

      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

      pc.ontrack = (event) => {
        set({ remoteStream: event.streams[0] });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc_signal", {
            to: targetUserId,
            signal: { type: "candidate", candidate: event.candidate },
          });
        }
      };

      set({ peerConnection: pc });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc_signal", {
        to: targetUserId,
        signal: { type: "offer", sdp: pc.localDescription },
      });
    });

    socket.on("call_rejected", (data) => {
      if (get().isCaller) get().sendLog("rejected");
      useChatStore.getState().upsertTemporaryCallLog({
        peerUser: {
          _id: data.calleeId,
          fullName: get().incomingCallData?.callerName || "User",
          profilePic: get().incomingCallData?.profilePic || "",
        },
        callType: get().callType,
        direction: "outgoing",
        text: data.reason === "busy" ? "User is busy" : "Call declined",
      });
      toast(data.reason === "busy" ? "User is busy" : "Call declined");
      get().resetState();
    });

    socket.on("call_ended", (data = {}) => {
      const peerUser = getPeerUserFromIncomingCallData(get().incomingCallData);
      useChatStore.getState().upsertTemporaryCallLog({
        peerUser,
        callType: get().callType,
        direction: get().isCaller ? "outgoing" : "incoming",
        text:
          data.reason === "timeout"
            ? `Missed ${formatCallLabel(get().callType)}`
            : "Call ended",
      });
      if (get().callStatus === "active" && get().isCaller) {
        get().sendLog("ended");
      }
      toast(data.reason === "timeout" ? "Missed call" : "Call ended");
      get().resetState();
    });

    socket.on("call_ended_abruptly", (data) => {
      const { incomingCallData, callStatus } = get();
      if (callStatus !== "idle" && incomingCallData?.callerId === data.userId) {
        useChatStore.getState().upsertTemporaryCallLog({
          peerUser: getPeerUserFromIncomingCallData(incomingCallData),
          callType: get().callType,
          direction: get().isCaller ? "outgoing" : "incoming",
          text: "Call ended",
        });
        toast("User disconnected");
        get().resetState();
      }
    });

    socket.on("video_upgrade_request", () => {
      set({ videoUpgradeStatus: "receiving" });
      const audio = new Audio("/sounds/notification.mp3");
      audio.play().catch((error) => console.log(error));
    });

    socket.on("video_upgrade_accept", async () => {
      const { peerConnection, localStream } = get();
      if (!localStream) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack) throw new Error("No video track available");

        localStream.addTrack(videoTrack);
        if (peerConnection) {
          peerConnection.addTrack(videoTrack, localStream);
        }

        set({ callType: "video", videoUpgradeStatus: "idle" });
      } catch {
        toast.error("Could not capture camera feed.");
        set({ videoUpgradeStatus: "idle" });
      }
    });

    socket.on("video_upgrade_reject", () => {
      toast.error("User declined video switch.");
      set({ videoUpgradeStatus: "idle" });
    });

    socket.on("webrtc_signal", async ({ from, signal }) => {
      const { peerConnection, localStream, incomingCallData } = get();
      if (!incomingCallData || from !== incomingCallData.callerId) return;

      if (signal.type === "offer") {
        let pc = peerConnection;

        if (!pc) {
          if (!localStream) return;

          pc = createPeerConnection();
          localStream.getTracks().forEach((track) =>
            pc.addTrack(track, localStream),
          );

          pc.ontrack = (event) => {
            set({ remoteStream: event.streams[0] });
          };

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit("webrtc_signal", {
                to: from,
                signal: { type: "candidate", candidate: event.candidate },
              });
            }
          };

          set({ peerConnection: pc });
        }

        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc_signal", {
          to: from,
          signal: { type: "answer", sdp: pc.localDescription },
        });
      } else if (signal.type === "answer") {
        if (peerConnection) {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(signal.sdp),
          );
        }
      } else if (signal.type === "candidate") {
        if (peerConnection) {
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(signal.candidate),
          );
        }
      }
    });
  },

  unlistenCallEvents: (socket) => {
    socket.off("call_incoming");
    socket.off("call_failed_offline");
    socket.off("call_accepted");
    socket.off("call_rejected");
    socket.off("call_ended");
    socket.off("call_ended_abruptly");
    socket.off("video_upgrade_request");
    socket.off("video_upgrade_accept");
    socket.off("video_upgrade_reject");
    socket.off("webrtc_signal");
    get().resetState();
  },
}));
