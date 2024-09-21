const express = require("express");
const router = express.Router();

router.use(
    require("../components/status/status.routes")
);

router.use(
    require("../components/uuid-generator/uuid-generator.routes")
);
module.exports = router;