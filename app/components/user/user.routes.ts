import express from "express";
import handler from "./user.handler";
import {authenticate, verifyToken} from "../auth/auth.middleware";  // Import the handler function directly
import {rateLimiter} from "../../helpers/routes.middlewares"
const router = express.Router();

// user registration does require token verification
router.all("/user", verifyToken, handler);
router.post("/register", rateLimiter, handler);
module.exports = router;
