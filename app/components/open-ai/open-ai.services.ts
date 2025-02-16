import OpenAI from "openai";
import Tesseract from "tesseract.js";
const openAI = new OpenAI();

export const openAIServices = {
  extractTextFromImage: async (image: string): Promise<string> => {
    const {
      data: { text },
    } = await Tesseract.recognize(image, "eng");
    return text.trim();
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

### Instructions:
- Carefully extract all relevant fields from the provided text.
- If any value is missing, return null for that key.
- Ensure numerical values (e.g., price, discount, VAT) are represented as numbers and not strings.
- Include relevant VAT categories and their respective amounts.

### Input Receipt Text:
${extractedText}

### Output:
Provide only the JSON structure as described above, without any additional text or commentary.
`,
        },
      ],
    });

    return completion.choices[0].message?.content || "";
  },
};
