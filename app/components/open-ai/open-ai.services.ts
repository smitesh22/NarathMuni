import OpenAI from "openai";
import { CLOUD_VISION_API_KEY } from "../../secrets/secrets";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { GoogleAuth } from "google-auth-library";

const openAI = new OpenAI();

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

            const detectedText = result.fullTextAnnotation?.text || "";

            console.log("Processed text:", detectedText);
            return detectedText;
        } catch (error) {
            console.error("Error processing image with Google Cloud Vision:", error);
            throw error;
        }
    },

    getAPIResponse: async (extractedText: string): Promise<any> => {
        try {
            const completion = await openAI.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You extract structured data from receipts, identifying unit price, total price, and discounts accurately.",
                    },
                    {
                        role: "user",
                        content: `Convert the following receipt text into a JSON object with this structure:

{
  "store": "Store name",
  "location": "Branch/location",
  "receipt_id": "Receipt number",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "items": [
    {
      "name": "Item name",
      "quantity": "Units or weight",
      "unit_price": "Price per unit/kg",
      "total_price": "unit_price * quantity",
      "discount": "Item discount (negative, exclude payment deductions)",
      "final_price": "total_price - discount (never zero unless free)",
      "category": "Tax category (A, B, etc.) if available"
    }
  ],
  "payment_method": "Payment mode",
  "tax_breakdown": {
    "0% VAT Amount": "Amount at 0% VAT",
    "13.5% VAT Amount": "Amount at 13.5% VAT",
    "0% VAT": "Tax at 0% VAT",
    "13.5% VAT": "Tax at 13.5% VAT"
  },
  "total_discount": "Sum of item discounts (ignore payment deductions)",
  "total_amount": "Sum of item final prices (exclude payment deductions)"
}

### Fixes:
1. Ignore negative values in payment section.
2. Ensure final_price = total_price - discount.
3. Recalculate total_amount from final prices.
4. Exclude non-item discounts from total_discount.
5. If total_discount matches total_amount, set total_discount to 0.

### Input Receipt Text:
${extractedText}

### Output:
Return a valid JSON object with no extra formatting.
`
                    }
                ]
            });
        } catch (error) {
            console.error("Error parsing API response:", error);
            return {};
        }
    },
};
