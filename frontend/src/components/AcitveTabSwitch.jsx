import { useChatStore } from "../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="px-4 pb-3 flex-shrink-0">
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        {["chats", "contacts"].map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold tracking-wide capitalize transition-all duration-200"
              style={{
                fontFamily: "'Syne', sans-serif",
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? '#fff' : 'var(--fg-subtle)',
                boxShadow: active ? '0 2px 12px rgba(129,140,248,0.35)' : 'none',
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ActiveTabSwitch;