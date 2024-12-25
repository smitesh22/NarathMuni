import express from "express";
import handler from "./user.handler";
import {authenticate, verifyToken} from "./user.middleware";  // Import the handler function directly

const router = express.Router();

router.all("/user", verifyToken, handler);
router.post("/register", handler);
router.post("/verify-user", handler);
router.post("/login", authenticate);
module.exports = router;
