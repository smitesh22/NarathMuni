import multer from "multer";
import multerS3 from "multer-s3";
import {s3} from "../../config/config";
import {S3_BUCKET_NAME} from "../../secrets/secrets";

export const fileService = {
    uploadToS3: multer({
        storage: multerS3({
            s3: s3,
            bucket: S3_BUCKET_NAME,
            metadata: (req, file, cb) => {
                cb(null, { fieldName: file.fieldname });
            },
            key: (req, file, cb) => {
                // Generate unique filenames for uploaded files
                const fileName = `content/${Date.now()}_${file.originalname}`;
                cb(null, fileName);
            }
        }),
    })
}