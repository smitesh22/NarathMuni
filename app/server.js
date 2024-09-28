const express = require("express");
const routes = require("./routes/routes");

const app = express();

app.use("/", routes);
app.get("/", (req, res) => {
    res.end("Hello World");
});

console.log(app);

module.exports = app;
