import { useState } from "react";
import {
  History,
  MessageSquare,
  Search,
  UserCircle,
  Users,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatList from "./ChatList";
import ContactList from "./ContactList";
import CallList from "./CallList";

function Sidebar({ onOpenProfile }) {
  const { authUser } = useAuthStore();
  const { activeTab, setActiveTab } = useChatStore();
  const [search, setSearch] = useState("");

  const tabs = [
    { id: "chats", label: "Chats", icon: MessageSquare },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "calls", label: "Calls", icon: History },
  ];

  return (
    <div
      className="flex flex-col h-screen flex-shrink-0"
      style={{ width: "var(--sidebar-w)", background: "var(--bg-card)", borderRight: "1px solid var(--border)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div
              className="size-9 rounded-full overflow-hidden"
              style={{ border: "2px solid var(--accent-border)" }}
            >
              <img
                src={authUser?.profilePic || "/avatar.png"}
                alt={`${authUser?.fullName || "User"} avatar`}
                className="size-full object-cover"
              />
            </div>
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-bold truncate"
              style={{ color: "var(--fg)", fontFamily: "'Syne',sans-serif" }}
            >
              {authUser?.fullName}
            </p>
            <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>Your account</p>
          </div>
        </div>

        <button
          onClick={onOpenProfile}
          className="size-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150"
          style={{ color: "var(--fg-subtle)", background: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--fg-subtle)";
          }}
          title="Edit profile"
          aria-label="Edit profile"
        >
          <UserCircle size={18} />
        </button>
      </div>

      <div className="px-4 py-3 flex-shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-subtle)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === "calls" ? "Search calls..." : "Search..."}
            aria-label={`Search ${activeTab}`}
            style={{
              width: "100%",
              paddingLeft: "32px",
              paddingRight: "12px",
              paddingTop: "8px",
              paddingBottom: "8px",
              fontSize: "13px",
              borderRadius: "10px",
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              color: "var(--fg)",
              outline: "none",
              fontFamily: "'DM Sans',sans-serif",
              transition: "all 0.15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent-border)";
              e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-glow)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      <div className="px-4 pb-3 flex-shrink-0">
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                style={{
                  fontFamily: "'Syne',sans-serif",
                  background: active ? "var(--accent)" : "transparent",
                  color: active ? "#fff" : "var(--fg-subtle)",
                  boxShadow: active ? "0 2px 10px rgba(129,140,248,0.3)" : "none",
                }}
                aria-pressed={active}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon size={12} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {activeTab === "chats" && <ChatList search={search} />}
        {activeTab === "contacts" && <ContactList search={search} />}
        {activeTab === "calls" && <CallList search={search} />}
      </div>
    </div>
  );
}

export default Sidebar;
