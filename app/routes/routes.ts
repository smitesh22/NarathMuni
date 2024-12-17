import express from "express";
const router = express.Router();

router.use(require("../components/status/status.routes"));
router.use(require("../components/uuid-generator/uuid-generator.routes"));
router.use(require("../components/user/user.routes"));
router.use(require("../components/content-object/content-object.routes"));
router.use(require("../components/files/file.routes"));

export default router;
