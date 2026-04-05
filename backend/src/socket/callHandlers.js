export const setupCallHandlers = (io, socket, userSocketMap, activeCalls) => {
  // ✅ accept activeCalls parameter
  const callerId = socket.userId;

  socket.on("call_request", ({ targetUserId, callType }) => {
    if (callerId === targetUserId) return;
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_incoming", {
        callerId,
        callerName: socket.user?.fullName || "User",
        profilePic: socket.user?.profilePic || "",
        callType,
      });
    } else {
      socket.emit("call_failed_offline", { targetUserId });
    }
  });

  socket.on("call_accept", ({ targetUserId }) => {
    // ✅ track both sides of the call
    activeCalls[callerId] = targetUserId;
    activeCalls[targetUserId] = callerId;

    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_accepted", { calleeId: callerId });
    }
  });

  socket.on("call_reject", ({ targetUserId, reason }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_rejected", {
        calleeId: callerId,
        reason: reason || "declined",
      });
    }
  });

  socket.on("call_busy", ({ targetUserId }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_rejected", {
        calleeId: callerId,
        reason: "busy",
      });
    }
  });

  socket.on("call_end", ({ targetUserId }) => {
    // ✅ clean up call tracking
    delete activeCalls[callerId];
    delete activeCalls[targetUserId];

    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_ended", { callerId });
    }
  });

  socket.on("call_timeout", ({ targetUserId }) => {
    // ✅ clean up on timeout too
    delete activeCalls[callerId];
    delete activeCalls[targetUserId];

    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_ended", { callerId, reason: "timeout" });
    }
  });

  socket.on("webrtc_signal", ({ to, signal }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc_signal", { from: callerId, signal });
    }
  });

  socket.on("video_upgrade_request", ({ targetUserId }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId)
      io.to(targetSocketId).emit("video_upgrade_request", { callerId });
  });

  socket.on("video_upgrade_accept", ({ targetUserId }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId)
      io.to(targetSocketId).emit("video_upgrade_accept", { callerId });
  });

  socket.on("video_upgrade_reject", ({ targetUserId }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId)
      io.to(targetSocketId).emit("video_upgrade_reject", { callerId });
  });
};