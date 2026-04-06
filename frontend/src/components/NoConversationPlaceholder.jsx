import { MessageCircle } from "lucide-react";

function NoConversationPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8" style={{ background: 'var(--bg)' }}>
      <div className="size-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid var(--accent-border)' }}>
        <MessageCircle size={28} style={{ color: 'var(--accent)' }} />
      </div>
      <h3 className="text-base font-bold mb-2" style={{ color: 'var(--fg)', fontFamily: "'Syne',sans-serif" }}>
        Select a conversation
      </h3>
      <p className="text-sm max-w-xs" style={{ color: 'var(--fg-subtle)', lineHeight: 1.6 }}>
        Choose someone from the sidebar to start chatting.
      </p>
    </div>
  );
}
export default NoConversationPlaceholder;