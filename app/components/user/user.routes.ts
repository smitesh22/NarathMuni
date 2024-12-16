import express from "express";
import handler from "./user.handler";  // Import the handler function directly

const router = express.Router();

router.all("/user", handler);
router.post("/register", handler);

module.exports = router;
