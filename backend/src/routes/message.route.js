import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getAllContacts,
  getMessageByUserId,
  sendMessage,
  getChatPartners,
} from "../controllers/messageControllers.js";
import { arcjectProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();
router.use(arcjectProtection ,protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/:id", getMessageByUserId);
router.post("/send/:id", sendMessage);

export default router;
