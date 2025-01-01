import express from "express";
const router = express.Router();

router.use(require("../components/status/status.routes"));
router.use(require("../components/uuid-generator/uuid-generator.routes"));
router.use(require("../components/user/user.routes"));
router.use(require("../components/content-object/content-object.routes"));
router.use(require("../components/files/file.routes"));
router.use(require("../components/open-ai/open-ai.routes"));
router.use(require("../components/payment/payment.routes"));
router.use(require("../components/auth/auth.routes"));

export default router;
