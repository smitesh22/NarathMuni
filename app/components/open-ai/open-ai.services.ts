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
                        content:
                            "You are a helpful assistant that extracts structured data from receipts and correctly identifies unit price, total price, and discounts.",
                    },
                    {
                        role: "user",
                        content: `You are an assistant that extracts structured data from receipts in a clean and organized format. Given the text of a receipt, convert it into a valid JSON object with the following structure:

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
      "discount": "Total discount applied (if any, as a negative value, EXCLUDING payment deductions)",
      "final_price": "Total price after discount (total_price - discount), MUST NEVER BE ZERO unless the item was free",
      "category": "Tax category (A, B, etc.) if available"
    }
  ],
  "payment_method": "Mode of payment",
  "tax_breakdown": {
    "0% VAT Amount": "Total Amount under 0% VAT",
    "13.5% VAT Amount": "Total Amount under 13.5% VAT",
    "0% VAT": "Tax Amount under 0% VAT",
    "13.5% VAT": "Tax Amount under 13.5% VAT"
  },
  "total_discount": "Total discount applied across all items, MUST NOT include payment deductions",
  "total_amount": "Final total amount paid after any discount"
}

### **Fixes to Apply:**
1. **Ignore negative values under the payment section** → These are not discounts.
2. **Ensure final_price = total_price - discount, but never zero unless the item was free**.
3. **Recalculate total_amount from the sum of item final prices (not payment deductions)**.
4. **Only apply discounts that are linked to an item, not the payment section**.
5. **If a discount is equal to total amount, reset total_discount to 0**.

### **Input Receipt Text:**
${extractedText}

### **Output:**
Return a valid JSON object without markdown, text, or extra formatting.
`,
                    },
                ],
            });

            // Ensure only the JSON content is extracted
            const jsonResponse = completion.choices[0].message?.content || "{}";

            // Remove accidental markdown formatting (triple backticks, etc.)
            const cleanJson = jsonResponse.replace(/```json|```/g, "").trim();
            console.log(cleanJson);
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error("Error parsing API response:", error);
            return {};
        }
    },
};
