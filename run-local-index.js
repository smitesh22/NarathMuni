const app = require("./app/server");
require('dotenv').config();
const port = 4000;
app.listen(4000, () => {
  console.info(`App is running on port http://localhost:${port}/`);
});
