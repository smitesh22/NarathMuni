import OpenAI from "openai";
import { TextractClient, AnalyzeDocumentCommand } from "@aws-sdk/client-textract";
import {AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY} from "../../secrets/secrets";
const openAI = new OpenAI();
const textractClient = new TextractClient(
    {
      region: "eu-west-1" ,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
      }
    });

export const openAIServices = {
  extractTextFromImage: async (imageBuffer: Buffer): Promise<string> => {
    console.log("Processing image with AWS Textract");

    const command = new AnalyzeDocumentCommand({
      Document: { Bytes: imageBuffer },
      FeatureTypes: ["TABLES", "FORMS"],
    });

    const response = await textractClient.send(command);

    const text = response.Blocks?.filter((block) => block.BlockType === "LINE")
        .map((block) => block.Text)
        .join(" ");

    console.log("Processed text:", text);
    return text || "";
  },

  getAPIResponse: async (extractedText: string) => {
    const completion = await openAI.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
              "You are a helpful assistant that extracts structured data from text.",
        },
        {
          role: "user",
          content: `
You are an assistant that extracts structured data from receipts in a clean and organized format. Given the text of a receipt, convert it into a JSON object with the following structure:

{
  "store": "Name of the store",
  "location": "Store location or branch",
  "receipt_id": "Unique ID or number from the receipt",
  "date": "Date in YYYY-MM-DD format",
  "time": "Time in HH:MM format",
  "items": [
    {
      "name": "Item name",
      "quantity": "Number or weight of the item (if applicable)",
      "price": "Unit price or total price for the item",
      "discount": "Discount applied (if any)",
      "category": "Tax category (A, B, etc.) if available"
    }
  ],
  "total_amount": "Final total amount paid",
  "payment_method": "Mode of payment",
  "tax_breakdown": {
    "0% VAT": "Amount under 0% VAT",
    "13.5% VAT": "Amount under 13.5% VAT"
  },
  "total_discount": "Total discount applied"
}

### Input Receipt Text:
${extractedText}

### Output:
Provide only the JSON structure as described above, without any additional text or commentary.
Always return a valid JSON object with no extra formatting or comments.
`,
        },
      ],
    });

    return completion.choices[0].message?.content || "";
  },
};