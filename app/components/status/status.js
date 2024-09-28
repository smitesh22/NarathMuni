module.exports = async function (req, res, next) {
  try {
    res.send(`Everything is OK on ${process.env.ENV} environment`);
    console.log("ayyaya");
  } catch (error) {
    console.error("Error occured on GET/ Status");
  }
};
