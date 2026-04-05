import { X, Video } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";
import { useNavigate } from "react-router-dom";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { callStatus, startOutgoingCall } = useCallStore();
  const { onlineUsers, socket, authUser } = useAuthStore();
  const navigate = useNavigate();

  const isOnline = onlineUsers.includes(selectedUser._id);
  const canCall = isOnline && callStatus === "idle";

  // generate consistent callId from both user ids
  // sorting ensures same callId regardless of who calls who
  const generateCallId = () => {
    return [authUser._id, selectedUser._id].sort().join("-");
  };

  const handleCall = () => {
    if (!socket || !canCall) return;

    const callId = generateCallId();

    startOutgoingCall({
      callId,
      targetUserId: selectedUser._id,
      callType: "video",
    });

    // notify receiver via socket
    socket.emit("call_request", {
      targetUserId: selectedUser._id,
      callType: "video",
      callId,
    });

    // navigate caller to call page
    navigate(`/call/${callId}`);
  };

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div
      className="flex justify-between items-center bg-slate-800/50 border-b
      border-slate-700/50 max-h-[84px] px-6 flex-1"
    >
      <div className="flex items-center space-x-3">
        <div className={`avatar ${isOnline ? "online" : "offline"}`}>
          <div className="w-12 rounded-full">
            <img
              src={selectedUser.profilePic || "/avatar.png"}
              alt={selectedUser.fullName}
            />
          </div>
        </div>

        <div>
          <h3 className="text-slate-200 font-medium">
            {selectedUser.fullName}
          </h3>
          <p className="text-slate-400 text-sm">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleCall}
          disabled={!canCall}
          className="p-2 bg-slate-800/50 border-r border-slate-700 
                     pr-5 mr-2 hover:bg-slate-700/50 rounded-full 
                     transition-colors disabled:opacity-50 
                     disabled:cursor-not-allowed"
        >
          <Video className="w-5 h-5 text-blue-400" />
        </button>

        <button onClick={() => setSelectedUser(null)}>
          <X className="w-5 h-5 text-slate-400 hover:text-slate-200 
                        transition-colors cursor-pointer" />
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;
