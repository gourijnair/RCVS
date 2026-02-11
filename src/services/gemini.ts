import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

export async function analyzeDocument(files: { data: string, mimeType: string }[], docType: string) {
    const prompt = `
    Today's Date: ${new Date().toDateString()}
    Analyze these vehicle document images/pages. They are supposed to be a ${docType}.
    
    If the document is a "Driving License":
    - Look specifically for "DL No", "Licence No", "License No", or patterns like "SS-RR-YYYY-NNNNNNN" or "SSRR YYYY NNNNNNN" (where S is state code, R is RTO code, Y is year).
    - Map this number to "regNumber".
    - Look for "Valid Till", "Expires on", "Validity" for the expiry date.
    - Look for "Class of Vehicle", "COV", "Vehicle Class" (e.g., LMV, MCWG, HGMV).
    
    If the document is a "Registration Certificate" (RC):
    - Look for "Regn No", "Registration No", or the main vehicle number plate string.
    - Map this to "regNumber".
    - Look for "Class", "Vehicle Class", "Type" (e.g., LMV, MCWG).

    Extract the following information:
    - Document Type Detected (e.g. "Driving License", "Registration Certificate", "Insurance", "PUC")
    - Vehicle Registration Number / License Number (as "regNumber")
    - Owner Name (if visible)
    - Expiry Date (if visible, format DD-MM-YYYY if possible)
    - Class of Vehicle (if visible, e.g. LMV, MCWG) as "classOfVehicle"
    - Issues (e.g., blurry, edited, mismatch, expired)

    Determine the status: VALID, EXPIRED, MISSING_INFO, or SUSPICIOUS.
    
    Return ONLY a JSON object with this structure:
    {
      "detectedType": "string",
      "regNumber": "string",
      "ownerName": "string",
      "expiryDate": "string",
      "classOfVehicle": "string",
      "issues": ["string"],
      "status": "VALID" | "EXPIRED" | "MISSING" | "SUSPICIOUS"
    }
  `;

    const parts = files.map(file => ({
        inlineData: {
            data: file.data,
            mimeType: file.mimeType,
        },
    }));

    const result = await model.generateContent([
        prompt,
        ...parts
    ]);

    const response = await result.response;
    const text = response.text();

    try {
        // Clean up potential markdown code blocks
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Failed to parse Gemini response:", text);
        throw new Error("AI Analysis Failed");
    }
}
