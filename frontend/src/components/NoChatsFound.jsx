import { MessageCircle } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function NoChatsFound() {
  const { setActiveTab } = useChatStore();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4 space-y-4">
      <div className="size-12 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid var(--accent-border)' }}>
        <MessageCircle size={20} style={{ color: 'var(--accent)' }} />
      </div>
      <div>
        <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--fg)', fontFamily: "'Syne',sans-serif" }}>No chats yet</h4>
        <p className="text-xs" style={{ color: 'var(--fg-subtle)' }}>Start by messaging someone from contacts</p>
      </div>
      <button onClick={() => setActiveTab("contacts")}
        className="px-4 py-2 rounded-xl text-xs font-bold"
        style={{ background: 'var(--accent)', color: '#fff', fontFamily: "'Syne',sans-serif", boxShadow: '0 2px 10px rgba(129,140,248,0.3)' }}>
        Browse Contacts
      </button>
    </div>
  );
}
export default NoChatsFound;