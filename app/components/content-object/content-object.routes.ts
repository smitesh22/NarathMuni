import express from "express";
import {verifyToken} from "../user/user.middleware";
import handler from "./content-object.handler";

const router = express.Router();

router.all("/content-object", verifyToken, handler);

module.exports = router;