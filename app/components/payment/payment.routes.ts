import express from "express";
import handler from "./payment.handler";
const router = express.Router();

router.post("/create-payment", handler);
router.post("/verify-payment", handler);

module.exports = router;