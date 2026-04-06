import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers, socket, authUser } = useAuthStore();
  const { callStatus, startOutgoingCall } = useCallStore();
  const navigate = useNavigate();

  const isOnline = onlineUsers.includes(selectedUser._id);
  const canCall = isOnline && callStatus === "idle";

  const generateCallId = () => {
    return [authUser._id, selectedUser._id].sort().join("-");
  };

  const handleVideoCall = () => {
    if (!socket || !canCall) return;

    const callId = generateCallId();
    startOutgoingCall({
      callId,
      targetUserId: selectedUser._id,
      callType: "video",
    });

    socket.emit("call_request", {
      targetUserId: selectedUser._id,
      callType: "video",
      callId,
    });

    navigate(`/call/${callId}`);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setSelectedUser]);

  return (
    <div
      className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className="size-10 rounded-full overflow-hidden"
            style={{
              border: `2px solid ${isOnline ? "var(--online)" : "var(--border-md)"}`,
              boxShadow: isOnline ? "0 0 0 3px rgba(52,211,153,0.15)" : "none",
            }}
          >
            <img
              src={selectedUser.profilePic || "/avatar.png"}
              alt={selectedUser.fullName}
              className="size-full object-cover"
            />
          </div>
          {isOnline && (
            <span
              className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full online-pulse"
              style={{ background: "var(--online)", border: "2px solid var(--bg-card)" }}
            />
          )}
        </div>

        <div>
          <h3
            className="text-sm font-bold"
            style={{ color: "var(--fg)", fontFamily: "'Syne',sans-serif" }}
          >
            {selectedUser.fullName}
          </h3>
          <p
            className="text-xs font-medium"
            style={{ color: isOnline ? "var(--online)" : "var(--fg-subtle)" }}
          >
            {isOnline ? "Online now" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedUser(null)}
          className="md:hidden size-8 rounded-xl flex items-center justify-center transition-all"
          style={{ color: "var(--fg-subtle)", background: "transparent" }}
          aria-label="Back to conversations"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          onClick={handleVideoCall}
          disabled={!canCall}
          className="h-9 px-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: canCall ? "#fff" : "var(--fg-subtle)",
            background: canCall ? "var(--accent)" : "var(--bg-hover)",
            boxShadow: canCall ? "0 8px 24px rgba(99,102,241,0.22)" : "none",
          }}
          title={canCall ? "Start video call" : "User is offline"}
          aria-label="Start video call"
        >
          <Video size={15} />
          <span
            className="text-xs font-semibold"
            style={{ fontFamily: "'Syne',sans-serif" }}
          >
            Video Call
          </span>
        </button>

        <button
          onClick={() => setSelectedUser(null)}
          className="size-8 rounded-xl flex items-center justify-center transition-all"
          style={{ color: "var(--fg-subtle)", background: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--fg-subtle)";
          }}
          title="Close (Esc)"
          aria-label="Close conversation"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;
