
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function listModels() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("No API_KEY found in .env");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // dummy
        // Actually we need to use the model manager if available, but the SDK structure is specific.
        // The SDK doesn't have a direct 'listModels' on genAI instance in some versions, 
        // but usually it's genAI.getGenerativeModel is for getting a model.
        // Wait, the error message said "Call ListModels".
        // I will try to use the API directly or check if the SDK supports it.
        // Let's try to assume the standard way: 
        // actually, let's just try to hit the API endpoint with fetch if SDK usage is unclear, 
        // BUT the SDK usually has a way. 
        // Let's try `genAI.getGenerativeModel({ model: "gemini-1.5-flash" })` ... 
        // Actually, I'll use a simple fetch to the list models endpoint using the key.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (${m.supportedGenerationMethods.join(", ")})`);
            });
        } else {
            console.error("No models found or error:", data);
        }

    } catch (error: any) {
        console.error("Error listing models:", error.message);
    }
}

listModels();
