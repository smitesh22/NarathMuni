import express from "express";
import handler from "./payment.handler";
import {stripeWebhookHandler} from "./payment.webhooks";
import bodyParser from "body-parser";
const router = express.Router();

router.post("/create-payment", handler);
router.post("/verify-payment", handler);
router.delete("/cancel-subscription", handler);
router.post("/stripe-webhook", bodyParser.raw({ type: "application/json" }), stripeWebhookHandler);

module.exports = router;
