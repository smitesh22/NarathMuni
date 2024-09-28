module.exports = async function (req, res, next) {
  try {
    res.send(`Everything is OK on ${process.env.ENV}`);
    console.log("ok");
    //#endregion



    console.log("aaa");
  } catch (error) {
    console.error("Error occured on GET/ Status");
  }
};
