import express, { NextFunction } from "express";
import { authenticate } from "./auth.middleware";
import handler from "./auth.handler";
import { rateLimiter } from "../../helpers/routes.middlewares";
import passport from "./auth.google.strategy";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {env, JWT_SECRET} from "../../secrets/secrets";
import { userService } from "../user/user.service";

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

const googleAuthHandler = passport.authenticate("google", {
  scope: ["profile", "email"],
}) as express.RequestHandler;

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  }),
);

router.get(
  "/google/redirect",
  passport.authenticate("google", { session: false }),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user || !("user" in req.user) || !("token" in req.user)) {
      console.error("Invalid req.user structure:", req.user);
      res.send(`<script>window.close();</script>`);
      return;
    }

    // Extract user object and token
    const { user, token } = req.user as {
      user: { id: string; email: string };
      token: string;
    };
    const { id, email } = user;

    if (!email) {
      console.error("Email is missing in req.user:", req.user);
      res.send(`<script>window.close();</script>`);
      return;
    }

    const foundUser = await userService.getUserByEmail(email);
    /*
      const redirectUrl =
          env === "LOCAL"
              ? "http://localhost:5173/dashboard"
              : "https://dev.ledgefast.com/dashboard";*/

     // console.log(redirectUrl);
      res.send(`
          <script>
            const redirectUrl = "https://dev.ledgefast.com/dashboard";
            window.opener.postMessage(
              { token: "${token}", user: ${JSON.stringify(foundUser)} },
              redirectUrl
            );
            window.close();
          </script>
        `);
  },
);
module.exports = router;
