import passport from "./auth.strategy";
import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../secrets/secrets";
import { UserModel } from "../../database/models/user";

export async function authenticate(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  passport.authenticate(
    "local",
    { session: false },
    async (err: any, user: { id: any; email: any }, info: { message: any }) => {
      try {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res
            .status(401)
            .json({ message: info?.message || "Unauthorized" });
        }

        const userObject = await UserModel.getUserById(user.id);

        if (!userObject.verified) {
          return res.status(401).send({ message: "User is not verified" });
        }

        if (!JWT_SECRET) {
          return res
            .status(500)
            .send({ message: "Secret key is missing on the server." });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

        return res.status(200).json({
          token: token,
          id: userObject.id,
          firstName: userObject.firstName,
          lastName: userObject.lastName,
          email: userObject.email,
          verified: userObject.verified,
          privileged: userObject.privileged,
          message: "Authenticated successfully",
        });
      } catch (error) {
        next(error); // Pass errors to the next middleware
      }
    },
  )(req, res, next);
}

export function verifyToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Access denied. No token provided." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    (req as any).user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token." });
  }
}
