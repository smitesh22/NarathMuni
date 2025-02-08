import express from "express";
import { openAIServices } from "./open-ai.services";
import { contentObjectService } from "../content-object/content-object.service";
import {
  contentObjectExtension,
  excelObjectType,
  imageObjectType,
} from "../../constants/constants";
import axios from "axios";
import generateExcelFromReceipt from "../helpers/generate-excel-from-receipt";

export default async function handler(
  req: express.Request,
  res: express.Response,
) {
  try {
    switch (req.method) {
      case "GET":
        try {
          const contentObjectId = req.query.id as string;
          const contentObject =
            await contentObjectService.getContentObjectById(contentObjectId);

          if (!contentObject) {
            res.status(404).send({ message: "Content Object Not Found" });
            break;
          }
          if (contentObject.type !== imageObjectType) {
            res.status(400).send({ message: "Send an image type object" });
            break;
          }

          const imageUrl =
            contentObject.extensions[`${contentObjectExtension}/location`];

          if (imageUrl) {
            const imageResponse = await axios.get(imageUrl, {
              responseType: "arraybuffer",
            });
            const imageBuffer = Buffer.from(imageResponse.data);

            const extractedText =
              await openAIServices.extractTextFromImage(imageBuffer);
            const processedText =
              await openAIServices.getAPIResponse(extractedText);

            const workbookBuffer = generateExcelFromReceipt(
              JSON.parse(processedText),
            );

            res.setHeader(
              "Content-Disposition",
              `attachment; filename=${contentObject.extensions[`${contentObjectExtension}/name`]}.xlsx`,
            );
            res.setHeader(
              "Content-Type",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            );
            res.send(workbookBuffer);
          } else {
            res.status(404).send({ message: "Image url does not exist" });
          }
          break;
        } catch (err) {
          console.error(err);
          res.status(500).send(err);
          break;
        }
      default:
        res.status(400).send("Valid method not passed for endpoint");
        return;
    }
  } catch (err) {
    console.log(err);
  }
}
