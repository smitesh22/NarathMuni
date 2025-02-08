import express from "express";
import handler from "./open-ai.handler";
import { verifyToken } from "../auth/auth.middleware";

const router = express.Router();

router.get("/process-image", handler);

module.exports = router;
