export const setupCallHandlers = (io, socket, userSocketMap) => {
  const callerId = socket.userId;

  // Emitted by caller to start ringing
  socket.on("call_request", ({ targetUserId, callType }) => {
    // Prevent self-calling
    if (callerId === targetUserId) return;

    const targetSocketId = userSocketMap[targetUserId];
    
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_incoming", {
        callerId,
        callerName: socket.user?.fullName || "User",
        profilePic: socket.user?.profilePic || "",
        callType
      });
    } else {
      socket.emit("call_failed_offline", { targetUserId });
    }
  });

  // Emitted by receiver when they Accept
  socket.on("call_accept", ({ targetUserId }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_accepted", { calleeId: callerId });
    }
  });

  // Emitted by receiver explicitly rejecting
  socket.on("call_reject", ({ targetUserId, reason }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_rejected", { calleeId: callerId, reason: reason || "declined" });
    }
  });

  // Emitted automatically by receiver's store if they are already in an active call
  socket.on("call_busy", ({ targetUserId }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_rejected", { calleeId: callerId, reason: "busy" });
    }
  });

  // Emitted by either party to wrap up a call or cancel before answer
  socket.on("call_end", ({ targetUserId }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_ended", { callerId });
    }
  });

  // Emitted when 30 seconds ringing timeout triggers
  socket.on("call_timeout", ({ targetUserId }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call_ended", { callerId, reason: "timeout" });
    }
  });

  // Emitted continuously to route WebRTC descriptions and ICE candidates
  socket.on("webrtc_signal", ({ to, signal }) => {
    // Security: Only use the strictly auth-verified `callerId` as the 'from' value
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc_signal", {
        from: callerId,
        signal
      });
    }
  });

  // Video Upgrade Signaling
  socket.on("video_upgrade_request", ({ targetUserId }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) io.to(targetSocketId).emit("video_upgrade_request", { callerId });
  });

  socket.on("video_upgrade_accept", ({ targetUserId }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) io.to(targetSocketId).emit("video_upgrade_accept", { callerId });
  });

  socket.on("video_upgrade_reject", ({ targetUserId }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) io.to(targetSocketId).emit("video_upgrade_reject", { callerId });
  });
};
