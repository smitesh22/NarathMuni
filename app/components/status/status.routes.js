const express = require("express");
const router = express.Router();

router.get("/status", require("./status"));

module.exports = router;
