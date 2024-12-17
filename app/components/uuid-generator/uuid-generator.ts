import { v4 as uuidv4 } from "uuid";
import express from "express";

module.exports = generateUUID;

async function generateUUID (req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    res.send(uuidv4());
  } catch (error) {
    console.error("Error occurred while fetching UUID");
  }
};
