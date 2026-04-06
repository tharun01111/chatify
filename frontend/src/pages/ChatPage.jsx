import { useState } from "react";
import { useChatStore } from "../store/useChatStore.js";
import Sidebar from "../components/Sidebar.jsx";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import ProfileModal from "../components/ProfileModal.jsx";

function ChatPage() {
  const { selectedUser } = useChatStore();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="chat-shell flex w-screen h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className={`${selectedUser ? "hidden md:flex" : "flex"} h-full`}>
        <Sidebar onOpenProfile={() => setShowProfile(true)} />
      </div>

      <div
        className={`${selectedUser ? "flex" : "hidden md:flex"} flex-1 flex-col overflow-hidden`}
        style={{ background: 'var(--bg)', borderLeft: '1px solid var(--border)' }}
      >
        {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}

export default ChatPage;
