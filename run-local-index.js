const app = require("./app/server");
const port = 4000;
app.listen(4000, () => {
  console.info(`App is running on port http://localhost:${port}/`);
});
