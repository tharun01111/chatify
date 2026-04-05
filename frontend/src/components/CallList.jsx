import { useEffect } from "react";
import {
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Video,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";

function CallList() {
  const {
    getCallHistory,
    callLogs,
    isCallLogsLoading,
    setSelectedUser,
    setActiveTab,
  } = useChatStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    getCallHistory();
  }, [getCallHistory]);

  const formatDate = (dateString) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateString));

  if (isCallLogsLoading) return <UsersLoadingSkeleton />;

  if (callLogs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
        <Phone size={48} className="mb-4 opacity-20" />
        <p>No call history yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {callLogs.map((log) => {
        const isOutgoing = log.senderId._id === authUser._id;
        const partner = isOutgoing ? log.receiverId : log.senderId;
        const text = (log.text || "").replace("ðŸ“ž ", "").replace("📞 ", "");
        const normalizedText = text.toLowerCase();
        const isMissed =
          normalizedText.includes("missed") ||
          normalizedText.includes("declined");
        const isVideo = normalizedText.includes("video");

        return (
          <div
            key={log._id}
            className="group flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/40 p-3 transition-all hover:bg-slate-800/60"
            onClick={() => {
              setSelectedUser(partner);
              setActiveTab("chats");
            }}
          >
            <div className="relative">
              <img
                src={partner.profilePic || "/avatar.png"}
                alt={partner.fullName}
                className="size-12 rounded-full border-2 border-slate-700 object-cover"
              />
              <div
                className={`absolute -bottom-1 -right-1 rounded-full border border-slate-700 bg-slate-900 p-1 ${
                  isMissed ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {isOutgoing ? (
                  <PhoneOutgoing size={12} />
                ) : isMissed ? (
                  <PhoneMissed size={12} />
                ) : (
                  <PhoneIncoming size={12} />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="truncate font-medium text-slate-200">
                  {partner.fullName}
                </h4>
                <span className="whitespace-nowrap text-[10px] text-slate-500">
                  {formatDate(log.createdAt)}
                </span>
              </div>
              <p
                className={`flex items-center gap-1 truncate text-xs ${
                  isMissed ? "text-red-400/80" : "text-slate-400"
                }`}
              >
                {isVideo ? <Video size={12} /> : <Phone size={12} />}
                {text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CallList;
