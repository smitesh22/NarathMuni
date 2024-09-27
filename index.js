const serverless = require("serverless-http");
const app = require("./app/server");
require('dotenv').config();
module.exports.handler = serverless(app);
