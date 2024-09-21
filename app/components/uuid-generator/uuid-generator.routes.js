const express = require("express");
const router = express.Router();

router.get("/uuid", require("./uuid-generator"));

module.exports = router;
