import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.Auth.Middleware.js";
import { setupCallHandlers } from "../socket/callHandlers.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

const userSocketMap = {};
export const activeCalls = {};
export const pendingCalls = {};
export const pendingCallTimers = {};

export function getReceiverSocketIds(userId) {
  return Array.from(userSocketMap[userId] || []);
}

function addUserSocket(userId, socketId) {
  if (!userSocketMap[userId]) {
    userSocketMap[userId] = new Set();
  }

  userSocketMap[userId].add(socketId);
}

function removeUserSocket(userId, socketId) {
  const userSockets = userSocketMap[userId];

  if (!userSockets) return;

  userSockets.delete(socketId);

  if (userSockets.size === 0) {
    delete userSocketMap[userId];
  }
}

function clearPendingCall(userId) {
  const peerId = pendingCalls[userId];

  if (!peerId) return null;

  const userTimer = pendingCallTimers[userId];
  const peerTimer = pendingCallTimers[peerId];

  if (userTimer) clearTimeout(userTimer);
  if (peerTimer && peerTimer !== userTimer) clearTimeout(peerTimer);

  delete pendingCalls[userId];
  delete pendingCalls[peerId];
  delete pendingCallTimers[userId];
  delete pendingCallTimers[peerId];

  return peerId;
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.user.fullName);

  const userId = socket.userId;
  addUserSocket(userId, socket.id);

  setupCallHandlers(
    io,
    socket,
    userSocketMap,
    activeCalls,
    pendingCalls,
    pendingCallTimers,
    clearPendingCall,
  );

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected: ", socket.user.fullName);
    removeUserSocket(userId, socket.id);

    const pendingPeerId = clearPendingCall(userId);
    if (pendingPeerId) {
      const pendingPeerSocketIds = getReceiverSocketIds(pendingPeerId);
      if (pendingPeerSocketIds.length > 0) {
        io.to(pendingPeerSocketIds).emit("call_rejected", {
          calleeId: userId,
          reason: "unavailable",
        });
      }
    }

    const activePeerId = activeCalls[userId];
    if (activePeerId) {
      const activePeerSocketIds = getReceiverSocketIds(activePeerId);
      if (activePeerSocketIds.length > 0) {
        io.to(activePeerSocketIds).emit("call_ended_abruptly", { userId });
      }
      delete activeCalls[userId];
      delete activeCalls[activePeerId];
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server };
