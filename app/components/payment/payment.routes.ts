import express from "express";
import handler from "./payment.handler";
import bodyParser from "body-parser";
const router = express.Router();

router.post("/create-payment", handler);
router.post("/verify-payment", handler);
router.delete("/cancel-subscription", handler);

module.exports = router;
