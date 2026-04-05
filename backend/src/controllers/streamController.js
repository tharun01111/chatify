import streamClient from "../lib/stream.js";
import { ENV } from "../lib/env.js";

export const getStreamToken = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const user = req.user;

    await streamClient.upsertUsers([
      {
        id: userId,
        name: user.fullName,
        image: user.profilePic || "",
      },
    ]);

    const token = streamClient.generateUserToken({ user_id: userId });

    res.status(200).json({
      token,
      apiKey: ENV.STREAM_API_KEY,
    });
  } catch (error) {
    console.log("Error generating Stream token:", error);
    res.status(500).json({ message: "Failed to generate stream token" });
  }
};
