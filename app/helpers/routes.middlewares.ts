import rateLimit from "express-rate-limit";
import { NextFunction, Request, Response } from "express";
import { userService } from "../components/user/user.service";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    status: 429,
    message: "Too many requests. Please try again later.",
  },
});

const userRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  limit: 5,
  message: {
    status: 429,
    message: "Too many requests. Please try again later.",
  },
});

export const rateLimiterUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // @ts-ignore
  if (req.user && (await userService.isUserPrivileged(req.user.id))) {
    return next();
  }
  return userRateLimiter(req, res, next);
};
