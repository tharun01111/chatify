import express from "express";

const router = express.Router();

router.get("/signup", (req, res)  => {
  res.send("Signup Endpoint");
});
router.get("/signout", (req, res)  => {
  res.send("Signout Endpoint");
});
router.get("/logout", (req, res)  => {
  res.send("Logout Endpoint");
});

export default router;