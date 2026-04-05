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

//apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);


export function getRecieverSocketId(userId) {
  return userSocketMap[userId];
}

//this is for storing online users
const userSocketMap = {}; // {userId:socketId}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.user.fullName);

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  // Initialize WebRTC Call Handlers
  setupCallHandlers(io, socket, userSocketMap);

  //io.emit() is used to send events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap)); //all connections
  // socket.emit()
  //with socket.on we can listen for any type of events from the clients
  socket.on("disconnect", () => {
    console.log("A user disconnected: ", socket.user.fullName);
    delete userSocketMap[userId];
    
    // Prompt active clients to tear down calls if this disconnected user was their peer
    socket.broadcast.emit("call_ended_abruptly", { userId });
    
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }); // individual connection
});

export { app, io, server };
