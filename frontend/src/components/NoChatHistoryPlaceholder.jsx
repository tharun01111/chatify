import { MessageCircle } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function NoChatHistoryPlaceholder({ name }) {
  const { sendMessage, selectedUser } = useChatStore();
  const starters = ["Hey there!", "How are you doing?", "Let's catch up!"];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div
        className="size-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(129,140,248,0.08)", border: "1px solid var(--accent-border)" }}
      >
        <MessageCircle size={24} style={{ color: "var(--accent)" }} />
      </div>
      <h3 className="text-sm font-bold mb-2" style={{ color: "var(--fg)", fontFamily: "'Syne',sans-serif" }}>
        Start chatting with {name}
      </h3>
      <p className="text-xs mb-5 max-w-xs" style={{ color: "var(--fg-subtle)", lineHeight: 1.6 }}>
        This is the beginning of your conversation. Say something.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {starters.map((message) => (
          <button
            key={message}
            onClick={() => {
              if (!selectedUser) return;
              void sendMessage({ text: message, image: null });
            }}
            disabled={!selectedUser}
            className="starter-chip px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--bg-secondary)", color: "var(--fg-muted)", border: "1px solid var(--border-md)" }}
          >
            {message}
          </button>
        ))}
      </div>
    </div>
  );
}

export default NoChatHistoryPlaceholder;
