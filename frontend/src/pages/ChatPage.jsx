import BorderAnimatedContainer from "../components/BorderAnimatedContainer.jsx";
import { useChatStore } from "../store/useChatStore.js";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/AcitveTabSwitch.jsx"
import ChatList from "../components/ChatList";
import ContactList from "../components/ContactList";
import CallList from "../components/CallList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();
  
  const renderSidebarContent = () => {
    switch(activeTab) {
      case "chats": return <ChatList />;
      case "contacts": return <ContactList />;
      case "calls": return <CallList />;
      default: return <ChatList />;
    }
  };

  return (
    <div className="relative w-full max-w-6xl h-[650px]">
      <BorderAnimatedContainer>
        {/* Left side */}
        <div className="w-80 bg-slate-800/50 backdrop-blur-sm flex flex-col">
          <ProfileHeader />
          <ActiveTabSwitch/>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {renderSidebarContent()}
          </div>
        </div>
        {/* Right Side */}
        <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm">
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}

export default ChatPage;
