const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function diagnose() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is missing in env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    console.log("🔍 Fetching available models...");

    try {
        // We use the REST endpoint directly for listing as it's more reliable for discovery
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        
        // Try v1 first
        const v1Url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
        const v1Resp = await fetch(v1Url);
        const v1Data = await v1Resp.json();
        
        console.log("\n--- v1 API Models ---");
        if (v1Data.models) {
            v1Data.models.forEach(m => console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`));
        } else {
            console.log("No models found or error in v1:", v1Data.error?.message || "Unknown error");
        }

        // Try v1beta
        const betaUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const betaResp = await fetch(betaUrl);
        const betaData = await betaResp.json();

        console.log("\n--- v1beta API Models ---");
        if (betaData.models) {
            betaData.models.forEach(m => console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`));
        } else {
            console.log("No models found or error in v1beta:", betaData.error?.message || "Unknown error");
        }

    } catch (err) {
        console.error("❌ Diagnostic failed:", err.message);
    }
}

diagnose();
