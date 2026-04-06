import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessageLoadingSkeleton";

function getCallMeta(text) {
  if (!text) return null;

  const normalizedText = text.toLowerCase();

  if (normalizedText.includes("video call ended unexpectedly")) {
    return { type: "video", state: "interrupted", icon: VideoOff };
  }

  if (normalizedText.includes("video call ended")) {
    return { type: "video", state: "ended", icon: Video };
  }

  if (normalizedText.includes("voice call ended")) {
    return { type: "voice", state: "ended", icon: Phone };
  }

  if (normalizedText.includes("declined video call")) {
    return { type: "video", state: "declined", icon: VideoOff };
  }

  if (normalizedText.includes("declined voice call")) {
    return { type: "voice", state: "declined", icon: PhoneOff };
  }

  if (normalizedText.includes("missed video call")) {
    return { type: "video", state: "missed", icon: VideoOff };
  }

  if (normalizedText.includes("missed voice call")) {
    return { type: "voice", state: "missed", icon: PhoneOff };
  }

  if (normalizedText.includes("offline for video call")) {
    return { type: "video", state: "offline", icon: VideoOff };
  }

  return null;
}

function extractDuration(text) {
  const match = text?.match(/\d+:\d+/);
  return match ? match[0] : null;
}

function getCallStatusLabel(meta, duration) {
  if (meta.state === "ended") {
    return duration ? `Ended · ${duration}` : "Ended";
  }

  if (meta.state === "offline") return "User Offline";
  if (meta.state === "missed") return "Missed";
  if (meta.state === "interrupted") return "Interrupted";
  return "Declined";
}

function CallBubble({ msg, isMine }) {
  const meta = getCallMeta(msg.text);
  const duration = extractDuration(msg.text);
  const Icon = meta.icon;
  const ended = meta.state === "ended";

  return (
    <div className={`flex items-end gap-2.5 ${isMine ? "flex-row-reverse" : ""}`}>
      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
          style={{
            background: ended ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
            border: `1px solid ${
              ended ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"
            }`,
            minWidth: "180px",
          }}
        >
          <div
            className="size-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: ended ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
            }}
          >
            <Icon size={14} style={{ color: ended ? "var(--online)" : "var(--danger)" }} />
          </div>
          <div>
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--fg)", fontFamily: "'Syne',sans-serif" }}
            >
              {meta.type === "video" ? "Video Call" : "Voice Call"}
            </p>
            <p
              className="text-[11px]"
              style={{ color: ended ? "var(--online)" : "var(--danger)" }}
            >
              {getCallStatusLabel(meta, duration)}
            </p>
          </div>
        </div>
        <p className="text-[10px] mt-1 px-1" style={{ color: "var(--fg-subtle)" }}>
          {new Date(msg.createdAt).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ChatHeader />

      <div
        className="flex-1 overflow-y-auto"
        style={{ background: "var(--bg)", padding: "20px 24px" }}
      >
        {isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : messages.length === 0 ? (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        ) : (
          <div className="flex flex-col gap-3" style={{ maxWidth: "820px", margin: "0 auto" }}>
            {messages.map((msg, i) => {
              const isMine = msg.senderId === authUser._id;
              const callMeta = getCallMeta(msg.text);

              if (callMeta) {
                return (
                  <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"} fade-up`}>
                    <CallBubble msg={msg} isMine={isMine} />
                  </div>
                );
              }

              return (
                <div
                  key={msg._id}
                  className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"} fade-up`}
                  style={{ animationDelay: `${Math.min(i * 0.012, 0.2)}s` }}
                >
                  <div className="size-7 rounded-full overflow-hidden flex-shrink-0 mb-1">
                    <img
                      src={
                        isMine
                          ? authUser.profilePic || "/avatar.png"
                          : selectedUser.profilePic || "/avatar.png"
                      }
                      alt=""
                      className="size-full object-cover"
                    />
                  </div>

                  <div
                    className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                    style={{ maxWidth: "65%" }}
                  >
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Shared"
                        className="mb-1 object-cover"
                        style={{
                          maxHeight: "240px",
                          maxWidth: "100%",
                          borderRadius: "14px",
                          border: "1px solid var(--border-md)",
                        }}
                      />
                    )}
                    {msg.text && (
                      <div
                        style={{
                          padding: "10px 14px",
                          fontSize: "14px",
                          lineHeight: "1.55",
                          wordBreak: "break-word",
                          borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          background: isMine ? "var(--accent)" : "var(--bg-secondary)",
                          color: isMine ? "#fff" : "var(--fg)",
                          border: isMine ? "none" : "1px solid var(--border-md)",
                          boxShadow: isMine ? "0 2px 10px rgba(129,140,248,0.2)" : "none",
                        }}
                      >
                        {msg.text}
                      </div>
                    )}
                    <p
                      style={{
                        fontSize: "10px",
                        marginTop: "4px",
                        paddingLeft: "4px",
                        paddingRight: "4px",
                        color: "var(--fg-subtle)",
                      }}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <MessageInput />
    </div>
  );
}

export default ChatContainer;
