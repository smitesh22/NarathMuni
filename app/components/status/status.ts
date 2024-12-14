import express from "express";


module.exports = async function (req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    res.send(`Everything is on ${process.env.ENV} Environment`);
  } catch (error) {
    console.error("Error occured on GET/ Status");
  }
};
