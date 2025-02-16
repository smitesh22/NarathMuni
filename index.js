import 'source-map-support/register';

const serverless = require("serverless-http");
const app = require("./app/server").default || require("./app/server");

// Custom error logging
process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Promise Rejection at:", promise, "reason:", reason);
});

require("dotenv").config();
console.log("App instance type:", typeof app);  // Should log "function" for an Express app
module.exports.handler = serverless(app);
