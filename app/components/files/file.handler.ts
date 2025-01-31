import express from 'express';
import {contentObjectExtension, imageObjectType} from "../../constants/constants";
import {contentObjectService} from "../content-object/content-object.service";
import {v4 as uuidv4} from "uuid";
import {S3_CLOUDFRONT_NAME} from "../../secrets/secrets";
import {ContentObjectExtensions} from "../../database/models/content-objects";

interface fileWithS3 extends Express.Multer.File {
    location: string;
    bucket: string;
}
export default async function handler(req: express.Request, res: express.Response): Promise<void> {
    try{
    switch (req.method) {
        case "POST":
            if(!req.file){
                res.status(400).send("File is required");
                return;
            }else if(!req.file.mimetype.includes("image")){
                res.status(400).send("File should be an image");
                return;
            }
            const file = req.file as fileWithS3;
            const extensions : ContentObjectExtensions = {
                [`${contentObjectExtension}/mimetype`]: file.mimetype as string,
                [`${contentObjectExtension}/name`]: file.originalname as string,
                [`${contentObjectExtension}/size`]: file.size as number,
                [`${contentObjectExtension}/bucket`]: file.bucket as string,
                [`${contentObjectExtension}/location`]: file.location as string,
                [`${contentObjectExtension}/user`]: (req.user as any).id as string,
            };

           const createdContentObject = await contentObjectService.createContentObject({
               id: uuidv4(),
               type: imageObjectType,
               extensions: extensions,
               createdOn: new Date(),
               updatedOn: new Date(),
           })

            res.status(201).json({
                message: "File uploaded successfully",
                file: {
                    originalName: (req.file as any).filename,
                    key: (req.file as any).key,
                    location: (req.file as any).location,
                    refFile: (req.file as any).refFile,
                },
                contentObject: createdContentObject
                ,
                refFile: req.file,
            });
            return;

        case "GET":
            if(!req.query.id){
                res.status(400).send("Content Object id is required");
                return;
            }

            const contentObject = await contentObjectService.getContentObjectById(req.query.id as string);
            if(!contentObject){
                res.status(400).send("Content Object not present with following id");
                return;
            }

            if (contentObject.extensions && typeof contentObject.extensions === 'object') {
                const filePath = contentObject.extensions[`${contentObjectExtension}/location`];
                if (filePath) {
                    const filename = filePath.split('/').pop() as string;
                    res.setHeader('Content-Disposition', `attachment; filename="${decodeURI(filename)}"`);
                    res.status(200).send(filePath);
                } else {
                    res.status(400).send('File path not found.');
                }
            } else {
                res.status(400).send('Invalid extensions or extensions is missing.');
            }
            return;

        default:
            res.status(400).send("This method is not allowed on this endpoint");
            break;
    }
    }catch(err){
        res.status(500).json(err);
    }
}