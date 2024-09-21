const { v4: uuidv4 } = require("uuid");

module.exports = async function (req, res, next) {
  try {
    res.send(uuidv4());
  } catch (error) {
    console.log("Error occured while fetching UUID");
  }
};
