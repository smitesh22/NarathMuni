import express from 'express';
import handler from "./file.handler";
import {fileService} from "./file.service";
import {verifyToken} from "../user/user.middleware";
import {rateLimiterUser} from "../../helpers/routes.middlewares";

const router = express.Router();

router.all(
    "/file",
    verifyToken,
    rateLimiterUser,
    fileService.uploadToS3.single("file"),
    handler
);

module.exports = router;