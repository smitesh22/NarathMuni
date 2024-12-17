import { S3Client } from "@aws-sdk/client-s3";
import {AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY} from "../secrets/secrets";

export const s3 = new S3Client({
    region: "eu-west-1",
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});
