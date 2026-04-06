import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { ENV } from "../lib/env.js";
import cloudinary from "../lib/cloudinary.js";
import {
  normalizeEmail,
  sanitizeBio,
  sanitizeName,
  validateImageSize,
  validateFileType,
} from "../lib/validators.js";
import xss from "xss";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const sanitizedName = xss(sanitizeName(fullName));
    const normalizedEmail = normalizeEmail(email);

    if (sanitizedName.length < 2)
      return res.status(400).json({ message: "Full name is too short" });

    if (password.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail))
      return res.status(400).json({ message: "Invalid email format" });

    const user = await User.findOne({ email: normalizedEmail });

    if (user)
      return res.status(400).json({ message: "User already exists..." });

    const salt = await bcrypt.genSalt(10);

    const hash = await bcrypt.hash(password, salt);

    const newUser = new User({
      email: normalizedEmail,
      password: hash,
      fullName: sanitizedName,
    });

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        bio: newUser.bio,
        createdAt: newUser.createdAt,
      });

      try {
        await sendWelcomeEmail(newUser.email, newUser.fullName, ENV.CLIENT_URL);
      } catch (error) {
        console.error("Failed to send Welcome Email");
      }
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "User already exists..." });
    }

    console.log("Error in SignUp controller " + error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "All fields are required" });
  try {
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isPass = await bcrypt.compare(password, user.password);

    if (!isPass)
      return res.status(400).json({ message: "Invalid credentials" });

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Error in login controller " + error);
    res.status(500).json("Internal server error");
  }
};

export const logout = (_, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully..." });
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName, bio } = req.body;

    const userId = req.user?._id || req.userId;
    const updates = {};

    if (typeof fullName === "string") {
      const sanitizedName = xss(sanitizeName(fullName));

      if (sanitizedName.length < 2) {
        return res.status(400).json({ message: "Full name is too short" });
      }

      updates.fullName = sanitizedName;
    }

    if (typeof bio === "string") {
      const sanitizedProfileBio = xss(sanitizeBio(bio));

      if (sanitizedProfileBio.length > 160) {
        return res.status(400).json({ message: "Bio must be 160 characters or less" });
      }

      updates.bio = sanitizedProfileBio;
    }

    if (profilePic) {
      if (!validateFileType(profilePic)) {
        return res.status(400).json({ message: "Invalid image format..." });
      }

      if (!validateImageSize(profilePic)) {
        return res
          .status(400)
          .json({ message: "Image too large. Max size 5 mb" });
      }

      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updates.profilePic = uploadResponse.secure_url;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No profile changes provided" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    res.status(201).json(updatedUser);
  } catch (err) {
    console.log("Error in update profile: ", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
