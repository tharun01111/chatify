import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";

function ChatList({ search = "" }) {
  const {
    getMyChatPartners,
    chats,
    isUsersLoading,
    setSelectedUser,
    selectedUser,
    setChatSearch,
  } = useChatStore();

  useEffect(() => {
    setChatSearch(search);
  }, [search, setChatSearch]);

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners, search]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  return (
    <div className="space-y-0.5">
      {chats.map(chat => {
        const isSelected = selectedUser?._id === chat._id;
        return (
          <button
            key={chat._id}
            onClick={() => setSelectedUser(chat)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
            style={{
              background: isSelected ? 'var(--bg-active)' : 'transparent',
              border:     isSelected ? '1px solid var(--accent-border)' : '1px solid transparent',
              boxShadow:  isSelected ? '0 2px 10px rgba(129,140,248,0.1)' : 'none',
            }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Avatar — no online dot */}
            <div
              className="size-10 rounded-full overflow-hidden flex-shrink-0"
              style={{ border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border-md)'}` }}
            >
              <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName} className="size-full object-cover" />
            </div>

            {/* Name only */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: isSelected ? 'var(--accent)' : 'var(--fg)', fontFamily: "'Syne',sans-serif" }}
              >
                {chat.fullName}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default ChatList;
