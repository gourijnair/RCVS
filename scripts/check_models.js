require('dotenv').config({ path: '.env' });
const https = require('https');

async function listModels() {
    console.log("Checking API Key:", process.env.API_KEY ? "Present" : "Missing");
    if (!process.env.API_KEY) {
        console.error("No API_KEY found in .env");
        return;
    }

    const apiKey = process.env.API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                if (jsonData.models) {
                    console.log("Available Models:");
                    jsonData.models.forEach(m => {
                        if (m.name.includes('gemini')) {
                            console.log(`- ${m.name}`);
                        }
                    });
                } else {
                    console.log("No models found or error structure:", jsonData);
                }
            } catch (e) {
                console.error("Error parsing JSON:", e);
                console.log("Raw response:", data);
            }
        });

    }).on("error", (err) => {
        console.error("Error fetching models:", err.message);
    });
}

listModels();
