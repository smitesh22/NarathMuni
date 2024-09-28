module.exports = async function (req, res, next) {
  try {
    res.send(`Smitesh Loves Aditi Very Very Much!!! :)`);
  } catch (error) {
    console.error("Error occured on GET/ Status");
  }
};
