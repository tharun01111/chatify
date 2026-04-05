export const setupCallHandlers = (io, socket, userSocketMap, activeCalls) => {
  const callerId = socket.userId;

  // Caller initiates call
  socket.on("call_request", ({ targetUserId, callType, callId }) => {
    if (callerId === targetUserId) return;

    const targetSocketId = userSocketMap[targetUserId];

    if (targetSocketId) {
      activeCalls[callerId] = targetUserId;
      activeCalls[targetUserId] = callerId;

      io.to(targetSocketId).emit("call_incoming", {
        callerId,
        callerName: socket.user?.fullName || "User",
        profilePic: socket.user?.profilePic || "",
        callType,
        callId, // receiver uses this to join same Stream room
      });
    } else {
      socket.emit("call_failed_offline", { targetUserId });
    }
  });

  // Receiver rejects call
  socket.on("call_reject", ({ targetUserId, reason }) => {
    delete activeCalls[callerId];
    delete activeCalls[targetUserId];

    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_rejected", {
        calleeId: callerId,
        reason: reason || "declined",
      });
    }
  });

  socket.on("call_joined", ({ targetUserId }) => {
    if (!targetUserId || callerId === targetUserId) return;

    activeCalls[callerId] = targetUserId;
    activeCalls[targetUserId] = callerId;
  });

  socket.on("call_end", ({ targetUserId }) => {
    delete activeCalls[callerId];
    delete activeCalls[targetUserId];

    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_ended", { userId: callerId });
    }
  });

  // Receiver is already in a call
  socket.on("call_busy", ({ targetUserId }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_rejected", {
        calleeId: callerId,
        reason: "busy",
      });
    }
  });
};
