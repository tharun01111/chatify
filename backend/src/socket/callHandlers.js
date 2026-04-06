const CALL_RING_TIMEOUT_MS = 30_000;
const ALLOWED_CALL_TYPES = new Set(["audio", "video"]);

export const setupCallHandlers = (
  io,
  socket,
  userSocketMap,
  activeCalls,
  pendingCalls,
  pendingCallTimers,
  clearPendingCall,
) => {
  const callerId = socket.userId;

  const getSocketIds = (userId) => Array.from(userSocketMap[userId] || []);

  socket.on("call_request", ({ targetUserId, callType, callId }) => {
    if (!targetUserId || !callId || callerId === targetUserId) return;

    if (!ALLOWED_CALL_TYPES.has(callType)) {
      console.warn("Rejected call_request with invalid callType", {
        callerId,
        targetUserId,
        callType,
      });
      socket.emit("call_rejected", { calleeId: targetUserId, reason: "invalid_call_type" });
      return;
    }

    if (activeCalls[callerId] || pendingCalls[callerId]) {
      socket.emit("call_rejected", { calleeId: targetUserId, reason: "busy" });
      return;
    }

    if (activeCalls[targetUserId] || pendingCalls[targetUserId]) {
      socket.emit("call_rejected", { calleeId: targetUserId, reason: "busy" });
      return;
    }

    const targetSocketIds = getSocketIds(targetUserId);

    if (targetSocketIds.length === 0) {
      socket.emit("call_failed_offline", { targetUserId });
      return;
    }

    pendingCalls[callerId] = targetUserId;
    pendingCalls[targetUserId] = callerId;

    const timeout = setTimeout(() => {
      clearPendingCall(callerId);
      const calleeSocketIds = getSocketIds(targetUserId);

      if (calleeSocketIds.length > 0) {
        io.to(calleeSocketIds).emit("call_rejected", {
          calleeId: callerId,
          reason: "missed",
        });
      }

      socket.emit("call_rejected", {
        calleeId: targetUserId,
        reason: "missed",
      });
    }, CALL_RING_TIMEOUT_MS);

    pendingCallTimers[callerId] = timeout;
    pendingCallTimers[targetUserId] = timeout;

    io.to(targetSocketIds).emit("call_incoming", {
      callerId,
      callerName: socket.user?.fullName || "User",
      profilePic: socket.user?.profilePic || "",
      callType,
      callId,
    });
  });

  socket.on("call_reject", ({ targetUserId, reason }) => {
    clearPendingCall(callerId);

    const targetSocketIds = getSocketIds(targetUserId);
    if (targetSocketIds.length > 0) {
      io.to(targetSocketIds).emit("call_rejected", {
        calleeId: callerId,
        reason: reason || "declined",
      });
    }
  });

  socket.on("call_joined", ({ targetUserId }) => {
    if (!targetUserId || callerId === targetUserId) return;

    clearPendingCall(callerId);
    activeCalls[callerId] = targetUserId;
    activeCalls[targetUserId] = callerId;
  });

  socket.on("call_end", ({ targetUserId }) => {
    clearPendingCall(callerId);
    delete activeCalls[callerId];
    delete activeCalls[targetUserId];

    const targetSocketIds = getSocketIds(targetUserId);
    if (targetSocketIds.length > 0) {
      io.to(targetSocketIds).emit("call_ended", { userId: callerId });
    }
  });

  socket.on("call_busy", ({ targetUserId }) => {
    clearPendingCall(callerId);

    const targetSocketIds = getSocketIds(targetUserId);
    if (targetSocketIds.length > 0) {
      io.to(targetSocketIds).emit("call_rejected", {
        calleeId: callerId,
        reason: "busy",
      });
    }
  });
};
