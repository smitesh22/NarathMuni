import express from "express";
const router = express.Router();

router.use(require("../components/status/status.routes"));
router.use(require("../components/uuid-generator/uuid-generator.routes"));
router.use(require("../components/user/user.routes"));

export default router;
