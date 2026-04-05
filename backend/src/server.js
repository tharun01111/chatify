import express from "express";
import path from "path";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.route.js";
import streamRoutes from "./routes/stream.routes.js";
import { connectDb } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import cookieParser from "cookie-parser";
import { app, server } from "./lib/socket.js";

const __dirname = path.resolve();
const PORT = ENV.PORT || 3000;

app.use(express.json({ limit: "5mb" }));
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/stream", streamRoutes);

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get(/.*/, (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectDb();
});
