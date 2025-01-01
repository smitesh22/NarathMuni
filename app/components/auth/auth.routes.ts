import express from "express";
import {authenticate} from "./auth.middleware";
import handler from "./auth.handler";
import {rateLimiter} from "../../helpers/routes.middlewares";

const router = express.Router();

//auth
// post /verify-token - verify user
// post /resend-token - resend verification token
// post /login - login user
// post /forgot-password - send reset password email
// post /reset-password - reset password
router.all("/verify-token", handler);
router.all("/resend-token", rateLimiter, handler);
router.all("/forgot-password", rateLimiter, handler);
router.all("/reset-password", rateLimiter, handler);
router.post("/login", authenticate);
module.exports = router;