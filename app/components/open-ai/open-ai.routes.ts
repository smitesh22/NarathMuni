import express from 'express';
import handler from "./open-ai.handler";

const router = express.Router();

router.get('/process-image', handler);

module.exports = router;