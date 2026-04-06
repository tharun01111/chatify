import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";

function ContactList({ search = "" }) {
  const {
    getAllContacts,
    allContacts,
    setSelectedUser,
    isUsersLoading,
    setContactSearch,
  } = useChatStore();

  useEffect(() => {
    setContactSearch(search);
    getAllContacts(search);
  }, [getAllContacts, search, setContactSearch]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (allContacts.length === 0)
    return (
      <p className="text-center text-xs py-10" style={{ color: 'var(--fg-subtle)' }}>
        No contacts found
      </p>
    );

  return (
    <div className="space-y-0.5">
      {allContacts.map(contact => (
        <button
          key={contact._id}
          onClick={() => setSelectedUser(contact)}
          className="contact-button w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
        >
          <div
            className="size-10 rounded-full overflow-hidden flex-shrink-0"
            style={{ border: '2px solid var(--border-md)' }}
          >
            <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName} className="size-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--fg)', fontFamily: "'Syne',sans-serif" }}>
              {contact.fullName}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

export default ContactList;
