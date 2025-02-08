import express from "express";
import { verifyToken } from "../user/user.middleware";
import handler from "./content-object.handler";
import { rateLimiter, rateLimiterUser } from "../../helpers/routes.middlewares";

const router = express.Router();

router.all("/content-object", verifyToken, rateLimiterUser, handler);

module.exports = router;
