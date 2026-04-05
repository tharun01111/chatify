import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const cookieHeader =
      socket.handshake.headers.cookie || socket.request?.headers?.cookie || "";
    const token = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((row) => row.startsWith("jwt="))
      ?.slice(4);

    if (!token) {
      console.log("Socket connection rejected: No token provided");
      return next(new Error("Unauthorized - No token Provided"));
    }

    //verify the token
    const decoded = jwt.verify(decodeURIComponent(token), ENV.JWT_SECRET);

    if (!decoded) {
      console.log("Socket connection rejected: Invalid token");
      return next(new Error("Unauthorized - Invalid token"));
    }

    //find the user fromdb
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return next(new Error("Unauthorized - User not found"));

    //attach user info to socket
    socket.user = user;
    socket.userId = user._id.toString();

    console.log(
      `Socket authenticated for user: ${user.fullName} (${user._id})`,
    );
    next();
  } catch (error) {
    console.log("Error in socket authentication: ", error.message);
    next(new Error("Unauthorized - Authentication failed"));
  }
};
