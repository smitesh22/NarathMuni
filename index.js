const serverless = require("serverless-http");
const app = require("./app/server").default || require("./app/server");
require("dotenv").config();
console.log("App instance type:", typeof app);  // Should log "function" for an Express app
module.exports.handler = serverless(app);
