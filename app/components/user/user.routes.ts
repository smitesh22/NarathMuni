import express from "express";
import handler from "./user";  // Import the handler function directly

const router = express.Router();

// Use the handler directly without require
router.get("/user", handler);
router.post("/user", handler);
router.put("/user", handler);
router.delete("/user", handler);

module.exports = router;
