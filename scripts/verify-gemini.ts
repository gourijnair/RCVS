
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function verify() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("No API_KEY found in .env");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = "gemini-flash-latest"; // as seen in source

    console.log(`Checking model: ${modelName}...`);

    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you ready?");
        console.log("Success! Response:", result.response.text());
    } catch (error: any) {
        console.error("Error verifying model:", error.message);
        if (error.message.includes("404")) {
            console.log("Recommend switching to gemini-1.5-flash");
        }
        process.exit(1);
    }
}

verify();
