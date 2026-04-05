import { X, Phone, Video } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { initiateCall, callStatus } = useCallStore();
  const { onlineUsers } = useAuthStore();
  const isOnline = onlineUsers.includes(selectedUser._id);
  const canCall = isOnline && callStatus === "idle";

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);

    // cleanup function
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
          onClick={() => initiateCall(selectedUser, "audio")}
          disabled={!canCall}
          className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Phone className="w-5 h-5 text-green-400" />
        </button>
        <button
          onClick={() => initiateCall(selectedUser, "video")}
          disabled={!canCall}
          className="p-2 bg-slate-800/50 border-r border-slate-700 pr-5 mr-2 hover:bg-slate-700/50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Video className="w-5 h-5 text-blue-400" />
        </button>
        <button onClick={() => setSelectedUser(null)}>
          <X className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer" />
        </button>
      </div>
    </div>
  );
}
export default ChatHeader;
