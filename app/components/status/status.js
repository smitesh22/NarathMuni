module.exports = async function (req, res, next) {
  try {
    res.send(`Everything is on ${process.env.ENV} Environment`);
  } catch (error) {
    console.error("Error occured on GET/ Status");
  }
};
