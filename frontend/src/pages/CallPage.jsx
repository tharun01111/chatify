import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
} from "@stream-io/video-react-sdk";
import { useCall } from "@stream-io/video-react-bindings";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { PhoneOff } from "lucide-react";
import PageLoader from "../components/PageLoader";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";

const getPeerIdFromCallId = (callId, currentUserId) =>
  callId
    .split("-")
    .map((id) => id.trim())
    .find((id) => id && id !== currentUserId) || null;

const swallowCleanupError = (scope, error) => {
  if (error) {
    console.warn(`Call cleanup warning (${scope}):`, error);
  }
};

const disposeCallSession = async ({ callInstance, clientInstance }) => {
  if (callInstance) {
    try {
      await callInstance.camera.disable(true);
    } catch (error) {
      swallowCleanupError("camera.disable", error);
    }

    try {
      await callInstance.microphone.disable(true);
    } catch (error) {
      swallowCleanupError("microphone.disable", error);
    }

    try {
      await callInstance.leave({ reject: false, message: "call cleanup" });
    } catch (error) {
      swallowCleanupError("call.leave", error);
    }
  }

  if (clientInstance) {
    try {
      await clientInstance.disconnectUser();
    } catch (error) {
      swallowCleanupError("client.disconnectUser", error);
    }
  }
};

function CallActionBar({ onEnd, isEnding }) {
  const call = useCall();

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-slate-700 bg-slate-900/90 px-4 py-3 shadow-2xl backdrop-blur">
        <ToggleAudioPublishingButton />
        <ToggleVideoPublishingButton />
        <button
          type="button"
          onClick={onEnd}
          disabled={!call || isEnding}
          className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PhoneOff className="size-4" />
          End Call
        </button>
      </div>
    </div>
  );
}

export default function CallPage() {
  const { callId } = useParams();
  const navigate = useNavigate();
  const { authUser, socket } = useAuthStore();
  const {
    callStatus,
    currentCallId,
    activePeerId,
    markCallActive,
    finalizeCallLog,
    resetCallState,
  } = useCallStore();

  const peerId = useMemo(
    () => activePeerId || getPeerIdFromCallId(callId, authUser?._id),
    [activePeerId, authUser?._id, callId],
  );

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnding, setIsEnding] = useState(false);

  const clientRef = useRef(null);
  const callRef = useRef(null);
  const hasExitedRef = useRef(false);
  const hasRedirectedForMissingStateRef = useRef(false);

  const exitCall = useCallback(
    async ({ endForAll = false, notifyPeer = false, shouldNavigate = true }) => {
      if (hasExitedRef.current) return;
      hasExitedRef.current = true;
      setIsEnding(true);

      const activeCall = callRef.current;
      const activeClient = clientRef.current;

      callRef.current = null;
      clientRef.current = null;

      if (notifyPeer && socket && peerId) {
        socket.emit("call_end", { targetUserId: peerId });
      }

      if (endForAll) {
        await finalizeCallLog({
          peerId,
          reason: "ended",
        });
      }

      if (activeCall) {
        try {
          await activeCall.camera.disable(true);
        } catch (error) {
          swallowCleanupError("camera.disable", error);
        }

        try {
          await activeCall.microphone.disable(true);
        } catch (error) {
          swallowCleanupError("microphone.disable", error);
        }

        try {
          if (endForAll) {
            await activeCall.endCall();
          } else {
            await activeCall.leave({
              reject: false,
              message: "user left the call",
            });
          }
        } catch (error) {
          swallowCleanupError(endForAll ? "call.endCall" : "call.leave", error);
        }
      }

      if (activeClient) {
        try {
          await activeClient.disconnectUser();
        } catch (error) {
          swallowCleanupError("client.disconnectUser", error);
        }
      }

      setCall(null);
      setClient(null);
      resetCallState();

      if (shouldNavigate) {
        navigate("/");
      }
    },
    [finalizeCallLog, navigate, peerId, resetCallState, socket],
  );

  useEffect(() => {
    if (!authUser || !callId) {
      navigate("/");
      return;
    }

    let cancelled = false;
    let unsubscribeEnded;
    let localClient = null;
    let localCall = null;

    const initCall = async () => {
      try {
        const { data } = await axiosInstance.get("/stream/token");

        if (cancelled) return;

        localClient = new StreamVideoClient({
          apiKey: data.apiKey,
          user: {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic || "",
          },
          token: data.token,
        });

        localCall = localClient.call("default", callId);
        await localCall.join({ create: true, video: true });

        if (cancelled) {
          await disposeCallSession({
            callInstance: localCall,
            clientInstance: localClient,
          });
          return;
        }

        unsubscribeEnded = localCall.on("call.ended", () => {
          exitCall({ endForAll: false, notifyPeer: false, shouldNavigate: true });
        });

        clientRef.current = localClient;
        callRef.current = localCall;

        if (socket && peerId) {
          socket.emit("call_joined", { targetUserId: peerId });
        }

        markCallActive({ callId, peerId, callType: "video" });
        setClient(localClient);
        setCall(localCall);
      } catch (error) {
        console.error("Failed to initialize call:", error);
        resetCallState();
        navigate("/");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    initCall();

    return () => {
      cancelled = true;
      unsubscribeEnded?.();

      const activeCall = callRef.current || localCall;
      const activeClient = clientRef.current || localClient;

      if (activeCall || activeClient) {
        void disposeCallSession({
          callInstance: activeCall,
          clientInstance: activeClient,
        });
      }
    };
  }, [
    authUser,
    callId,
    exitCall,
    markCallActive,
    navigate,
    peerId,
    resetCallState,
    socket,
  ]);

  useEffect(() => {
    if (!socket || !peerId) return;

    const handleSocketEnded = ({ userId } = {}) => {
      if (userId && userId !== peerId) return;
      exitCall({ endForAll: false, notifyPeer: false, shouldNavigate: true });
    };

    socket.on("call_ended", handleSocketEnded);
    socket.on("call_ended_abruptly", handleSocketEnded);

    return () => {
      socket.off("call_ended", handleSocketEnded);
      socket.off("call_ended_abruptly", handleSocketEnded);
    };
  }, [exitCall, peerId, socket]);

  useEffect(() => {
    const handlePageHide = () => {
      const activeCall = callRef.current;
      const activeClient = clientRef.current;

      if (activeCall || activeClient) {
        void disposeCallSession({
          callInstance: activeCall,
          clientInstance: activeClient,
        });
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  useEffect(() => {
    if (
      !isLoading &&
      currentCallId === callId &&
      callStatus === "idle" &&
      !hasExitedRef.current
    ) {
      navigate("/");
    }
  }, [callId, callStatus, currentCallId, isLoading, navigate]);

  useEffect(() => {
    if (isLoading || (client && call)) {
      hasRedirectedForMissingStateRef.current = false;
      return;
    }

    if (hasRedirectedForMissingStateRef.current) return;

    hasRedirectedForMissingStateRef.current = true;
    toast.error("Unable to load call");
    navigate("/", { replace: true });
  }, [call, client, isLoading, navigate]);

  if (isLoading) return <PageLoader />;
  if (!client || !call) return <PageLoader />;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950">
      <StreamVideo client={client}>
        <StreamTheme>
          <StreamCall call={call}>
            <div className="relative h-full w-full">
              <SpeakerLayout />
              <CallActionBar
                isEnding={isEnding}
                onEnd={() =>
                  exitCall({
                    endForAll: true,
                    notifyPeer: true,
                    shouldNavigate: true,
                  })
                }
              />
            </div>
          </StreamCall>
        </StreamTheme>
      </StreamVideo>
    </div>
  );
}
