import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { getRecieverSocketId, io } from "../lib/socket.js";
import mongoose from "mongoose";
import { validateFileType, validateImageSize } from "../lib/validators.js";
import xss from "xss";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (err) {
    console.log("Error in getAllContacts: ", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessageByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { cursor } = req.query;
    const { id: userToChatId } = req.params;

    //To get both messsages sent by me and the other user i should use
    //$or operator

    const query = {
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      ...(cursor && { _id: { $lt: new mongoose.Types.ObjectId(cursor) } }),
    };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(21);

    const hasMore = messages.length === 21;

    if (hasMore) messages.pop();

    const orderedMessages = messages.reverse();

    res.status(200).json({ messages: orderedMessages, hasMore });
  } catch (err) {
    console.log("Error in getMessages controller: ", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const sanitizedText = text ? xss(text) : text;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }

    if (image) {
      if (!validateFileType(image)) {
        return res.status(400).json({ message: "Invalid image format..." });
      }

      if (!validateImageSize(image)) {
        return res
          .status(400)
          .json({ message: "Image too large. Max size 5 mb" });
      }
    }

    if (senderId.equals(receiverId)) {
      return res
        .status(400)
        .json({ message: "Cannot send messages to yourself." });
    }
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: sanitizedText,
      image: imageUrl,
    });

    await newMessage.save();

    //we will use this function to check if the user is online or not
    const recieverSocketId = getRecieverSocketId(receiverId);
    if (recieverSocketId) {
      io.to(recieverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error occured in sendMessage controller: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString(),
        ),
      ),
    ];

    const chatPartners = await User.find({
      _id: { $in: chatPartnerIds },
    }).select("-password");

    res.status(200).json(chatPartners);
  } catch (err) {
    console.log("Error in getChatPartners controller: ", err.message);
    res.status(500).json("Internal Server error");
  }
};
