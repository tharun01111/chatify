import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

const getUserId = (user) => {
  if (!user) return null;
  if (typeof user === "string") return user;
  if (typeof user === "object" && user._id) return user._id.toString();
  return user.toString?.() || null;
};

const normalizeMessageUserId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return value._id.toString();
  return value.toString?.() || null;
};

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  callLogs: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isCallLogsLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
  cursor: null,
  hasMore: false,
  isLoadingMore: false,
  contactSearch: "",
  chatSearch: "",
  contactSearchRequestId: 0,
  chatSearchRequestId: 0,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setContactSearch: (contactSearch) => set({ contactSearch }),
  setChatSearch: (chatSearch) => set({ chatSearch }),

  findUserById: (userId) => {
    const normalizedUserId = getUserId(userId);
    const { authUser } = useAuthStore.getState();
    const { selectedUser, allContacts, chats, callLogs } = get();

    const candidates = [
      authUser,
      selectedUser,
      ...allContacts,
      ...chats,
      ...callLogs.flatMap((log) => [log.senderId, log.receiverId]),
    ].filter(Boolean);

    const match = candidates.find(
      (candidate) => getUserId(candidate) === normalizedUserId,
    );

    if (match) {
      return {
        _id: getUserId(match),
        fullName: match.fullName || "User",
        profilePic: match.profilePic || "",
      };
    }

    return {
      _id: normalizedUserId,
      fullName: "User",
      profilePic: "",
    };
  },

  buildCallLogFromMessage: (message) => ({
    ...message,
    senderId: get().findUserById(message.senderId),
    receiverId: get().findUserById(message.receiverId),
  }),

  upsertCallLog: (log) => {
    const authUser = useAuthStore.getState().authUser;
    if (!authUser || !log) return;

    const normalizedLog =
      typeof log.senderId === "object" && typeof log.receiverId === "object"
        ? log
        : get().buildCallLogFromMessage(log);

    const senderId = getUserId(normalizedLog.senderId);
    const receiverId = getUserId(normalizedLog.receiverId);
    const peerId =
      senderId === authUser._id ? receiverId : senderId || receiverId;
    const tempId = peerId ? `temp-call-${peerId}` : null;

    set({
      callLogs: [normalizedLog].concat(
        get().callLogs.filter(
          (entry) => entry._id !== normalizedLog._id && entry._id !== tempId,
        ),
      ),
    });
  },

  upsertTemporaryCallLog: ({ peerUser, text, callType, direction }) => {
    const authUser = useAuthStore.getState().authUser;
    if (!authUser || !peerUser?._id) return;

    const tempId = `temp-call-${peerUser._id}`;
    const isOutgoing = direction === "outgoing";
    const senderUser = isOutgoing
      ? {
          _id: authUser._id,
          fullName: authUser.fullName,
          profilePic: authUser.profilePic || "",
        }
      : {
          _id: peerUser._id,
          fullName: peerUser.fullName || "User",
          profilePic: peerUser.profilePic || "",
        };
    const receiverUser = isOutgoing
      ? {
          _id: peerUser._id,
          fullName: peerUser.fullName || "User",
          profilePic: peerUser.profilePic || "",
        }
      : {
          _id: authUser._id,
          fullName: authUser.fullName,
          profilePic: authUser.profilePic || "",
        };

    const temporaryLog = {
      _id: tempId,
      senderId: senderUser,
      receiverId: receiverUser,
      text,
      messageType: "call",
      callType,
      createdAt: new Date().toISOString(),
      isTemporary: true,
    };

    set({
      callLogs: [temporaryLog].concat(
        get().callLogs.filter((entry) => entry._id !== tempId),
      ),
    });
  },

  removeTemporaryCallLog: (peerId) => {
    if (!peerId) return;

    set({
      callLogs: get().callLogs.filter(
        (entry) => entry._id !== `temp-call-${peerId}`,
      ),
    });
  },

  appendMessageIfRelevant: (message) => {
    const selectedUserId = getUserId(get().selectedUser);
    if (!selectedUserId) return;

    const senderId = normalizeMessageUserId(message.senderId);
    const receiverId = normalizeMessageUserId(message.receiverId);
    const belongsToSelectedConversation =
      senderId === selectedUserId || receiverId === selectedUserId;

    if (!belongsToSelectedConversation) return;

    set({
      messages: get().messages.some((entry) => entry._id === message._id)
        ? get().messages
        : [...get().messages, message],
    });
  },

  handleIncomingSocketMessage: (newMessage) => {
    get().appendMessageIfRelevant(newMessage);

    if (newMessage.messageType === "call") {
      get().upsertCallLog(newMessage);
    }

    const { isSoundEnabled } = get();
    const { authUser } = useAuthStore.getState();
    const senderId = normalizeMessageUserId(newMessage.senderId);

    if (isSoundEnabled && authUser && senderId !== authUser._id) {
      const notificationSound = new Audio("/sounds/notification.mp3");
      notificationSound.currentTime = 0;
      notificationSound
        .play()
        .catch((error) => console.log("Audio play failed:", error));
    }
  },

  bindSocketEvents: (socket) => {
    socket.off("newMessage");
    socket.on("newMessage", (newMessage) => {
      get().handleIncomingSocketMessage(newMessage);
    });
  },

  unbindSocketEvents: (socket) => {
    socket.off("newMessage");
  },

  getAllContacts: async (searchOverride) => {
    const requestId = get().contactSearchRequestId + 1;
    set({ isUsersLoading: true, contactSearchRequestId: requestId });
    try {
      const search = (searchOverride ?? get().contactSearch).trim();
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);

      const res = await axiosInstance.get(`/message/contacts?${params.toString()}`);

      if (get().contactSearchRequestId === requestId) {
        set({ allContacts: res.data });
      }
    } catch (error) {
      if (get().contactSearchRequestId === requestId) {
        toast.error(error.response?.data?.message || "Failed to load contacts");
      }
    } finally {
      if (get().contactSearchRequestId === requestId) {
        set({ isUsersLoading: false });
      }
    }
  },

  getMyChatPartners: async (searchOverride) => {
    const requestId = get().chatSearchRequestId + 1;
    set({ isUsersLoading: true, chatSearchRequestId: requestId });
    try {
      const search = (searchOverride ?? get().chatSearch).trim();
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);

      const res = await axiosInstance.get(`/message/chats?${params.toString()}`);

      if (get().chatSearchRequestId === requestId) {
        set({ chats: res.data });
      }
    } catch (error) {
      if (get().chatSearchRequestId === requestId) {
        toast.error(error.response?.data?.message || "Failed to load chats");
      }
    } finally {
      if (get().chatSearchRequestId === requestId) {
        set({ isUsersLoading: false });
      }
    }
  },

  getCallHistory: async () => {
    set({ isCallLogsLoading: true });
    try {
      const res = await axiosInstance.get("/message/calls");
      set({ callLogs: res.data });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load call history",
      );
    } finally {
      set({ isCallLogsLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({
      messages: [],
      hasMore: false,
      isLoadingMore: false,
      cursor: null,
      isMessagesLoading: true,
    });
    try {
      const res = await axiosInstance.get(`/message/${userId}`);
      set({
        messages: res.data.messages,
        cursor: res.data.messages[0]?._id,
        hasMore: res.data.hasMore,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  loadMoreMessages: async (userId) => {
    if (!get().hasMore) return;
    try {
      set({ isLoadingMore: true });
      const cursor = get().cursor;
      const currentMessage = get().messages;

      const res = await axiosInstance.get(`/message/${userId}?cursor=${cursor}`);
      set({
        messages: [...res.data.messages, ...currentMessage],
        cursor: res.data.messages[0]?._id,
        hasMore: res.data.hasMore,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isLoadingMore: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();

    if (!selectedUser?._id || !authUser?._id) {
      return null;
    }

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(
        `/message/send/${selectedUser._id}`,
        messageData,
      );
      const currentMessage = get().messages;
      set({
        messages: currentMessage.filter((m) => m._id !== tempId).concat(res.data),
      });

      if (res.data.messageType === "call") {
        get().upsertCallLog(res.data);
      }

      return res.data;
    } catch (error) {
      set({ messages });
      toast.error(error.response?.data?.message || "Something went wrong");
      return null;
    }
  },

  subscribeToMessages: () => {},
  unsubscribeFromMessages: () => {},
}));
