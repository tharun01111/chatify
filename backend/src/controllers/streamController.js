import streamClient from "../lib/stream.js";

export const getStreamToken = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const user = req.user;

        // upsert user to Stream
        await streamClient.upsertUsers([{
            id: userId,
            name: user.fullName,
            image: user.profilePic || "",
        }]);

        // generate token
        const token = streamClient.generateUserToken({ user_id: userId });

        res.status(200).json({ 
            token,
            apiKey: process.env.STREAM_API_KEY
        });
    } catch (error) {
        console.log("Error generating Stream token:", error);
        res.status(500).json({ message: "Failed to generate stream token" });
    }
};