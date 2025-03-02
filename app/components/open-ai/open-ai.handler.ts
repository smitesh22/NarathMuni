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
    res: express.Response
) {
  try {
    switch (req.method) {
      case "GET":
        try {
          const contentObjectId = req.query.id as string;
          console.log("📌 Content Object ID:", contentObjectId);

          const contentObject =
              await contentObjectService.getContentObjectById(contentObjectId);

          console.log("📌 Content Object Found:", !!contentObject);
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

          console.log("📌 Image URL:", imageUrl);

          if (imageUrl) {
            console.log("Fetching image from URL");
            const imageResponse = await axios.get(imageUrl, {
              responseType: "arraybuffer",
            });
            const imageBuffer = Buffer.from(imageResponse.data, "binary");
            console.log("✅ Image Fetched, Size:", imageBuffer.length);
            console.log("Processing Image with AWS Textract");
            const extractedText =
                await openAIServices.extractTextFromImage(imageBuffer);
            console.log("✅ Extracted Text:", extractedText);
            console.log("📌 Sending to OpenAI for Processing...");
            const processedText =
                await openAIServices.getAPIResponse(extractedText);
            console.log("✅ Processed Text:", processedText);

            console.log("📌 Generating Excel File...");
            const workbookBuffer = await generateExcelFromReceipt(
                JSON.parse(processedText)
            );

            console.log("✅ Excel File Created, Size:", workbookBuffer.length);

            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${contentObject.extensions[`${contentObjectExtension}/name`]}.xlsx`
            );
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            console.log("📌 Sending Excel File...");
            res.send(workbookBuffer);
          } else {
            res.status(404).send({ message: "Image URL does not exist" });
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
