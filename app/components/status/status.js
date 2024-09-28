module.exports = async function (req, res, next) {
  try {
    res.send(`Everything is OK on ${process.env.ENV}`);
    console.log("sc");
  } catch (error) {
    console.error("Error occured on GET/ Status");
  }
};
