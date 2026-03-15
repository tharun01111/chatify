import express from "express";
import { signup } from "../controllers/auth.controllers.js";

const router = express.Router();

router.post("/signup", signup);
router.get("/signout", (req, res)  => {
  res.send("Signout Endpoint");
});
router.get("/logout", (req, res)  => {
  res.send("Logout Endpoint");
});

export default router;