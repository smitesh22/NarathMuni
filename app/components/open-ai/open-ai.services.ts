import OpenAI from "openai";

import { CLOUD_VISION_API_KEY} from "../../secrets/secrets";
const openAI = new OpenAI();
import {ImageAnnotatorClient} from "@google-cloud/vision";
import {GoogleAuth} from "google-auth-library";

const client = new ImageAnnotatorClient({
    auth: new GoogleAuth({
        apiKey: CLOUD_VISION_API_KEY,
    }),
});


export const openAIServices = {
    extractTextFromImage: async (imageBuffer: Buffer): Promise<string> => {
        try {

            const [result] = await client.textDetection({
                image: { content: imageBuffer },
            });

            const detectedText = result.fullTextAnnotation?.text || '';

            console.log("Processed text:", detectedText);
            return detectedText;
        } catch (error) {
            console.error("Error processing image with Google Cloud Vision:", error);
            throw error;
        }
    },
    getAPIResponse: async (extractedText: string) => {
        const completion = await openAI.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a helpful assistant that extracts structured data from receipts and correctly identifies unit price, total price, and discounts.",
                },
                {
                    role: "user",
                    content: `
You are an assistant that extracts structured data from receipts in a clean and organized format. Given the text of a receipt, convert it into a valid JSON object with the following structure:

{
  "store": "Name of the store",
  "location": "Store location or branch",
  "receipt_id": "Unique ID or number from the receipt",
  "date": "Date in YYYY-MM-DD format",
  "time": "Time in HH:MM format",
  "items": [
    {
      "name": "Item name",
      "quantity": "Number of units or weight (if applicable)",
      "unit_price": "Price per unit or per kg",
      "total_price": "Total price before discounts (unit_price * quantity)",
      "discount": "Total discount applied (if any, as a negative value)",
      "final_price": "Total price after discount",
      "category": "Tax category (A, B, etc.) if available"
    }
  ],
  "total_amount": "Final total amount paid",
  "payment_method": "Mode of payment",
  "tax_breakdown": {
    "0% VAT Amount": "Total Amount under 0% VAT",
    "13.5% VAT Amount": "Total Amount under 13.5% VAT"
    "0% VAT": "Tax Amount under 0% VAT",
    "13.5% VAT": "Tax Amount under 13.5% VAT"
    
  },
  "total_discount": "Total discount applied across all items"
}

### Important Parsing Rules:
1. **Ensure valid JSON output. Do not include markdown or extra formatting (like triple backticks).**
2. **The unit price should always be the standalone price per unit or per kg.**
3. **The total price should be calculated as: unit_price * quantity.**
4. **If a discount exists, subtract it separately to calculate final_price.**
5. **Always return a single valid JSON object without any text or formatting.**
6. **If a field is missing in the receipt, leave it as an empty string or an empty array instead of omitting it.**

### Input Receipt Text:
${extractedText}

### Output:
Only return a valid JSON object following the structure above. No extra text, markdown, or formatting.
`,
                },
            ],
        });

        try {
            // Ensure only the JSON content is extracted
            const jsonResponse = completion.choices[0].message?.content || "{}";

            // Remove accidental markdown formatting (triple backticks, etc.)
            const cleanJson = jsonResponse.replace(/```json|```/g, "").trim();
            console.log(cleanJson)
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error("Error parsing API response:", error);
            return {};
        }
    },

};