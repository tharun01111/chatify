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

export function getRecieverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {};
export const activeCalls = {}; // ✅ add this! tracks who is in call with who

io.on("connection", (socket) => {
  console.log("A user connected:", socket.user.fullName);

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  setupCallHandlers(io, socket, userSocketMap, activeCalls); // ✅ pass activeCalls

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected: ", socket.user.fullName);
    delete userSocketMap[userId];

    // ✅ Only notify the PEER not everyone!
    const peerId = activeCalls[userId];
    if (peerId) {
      const peerSocketId = userSocketMap[peerId];
      if (peerSocketId) {
        io.to(peerSocketId).emit("call_ended_abruptly", { userId });
      }
      delete activeCalls[userId];
      delete activeCalls[peerId];
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server };