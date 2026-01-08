const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize with improved error handling and fallback
const apiKey = process.env.GEMINI_API_KEY;

let model;

try {
    if (!apiKey) {
        console.warn("⚠️  WARNING: GEMINI_API_KEY is not set. AI features will fail.");
    } else {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Explicitly use v1 API for better stability
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
        console.log("✅ AI Service Initialized with model: gemini-1.5-flash (v1 API)");
    }
} catch (error) {
    console.error("❌ Failed to initialize AI Service:", error);
}

const { checkQuota, incrementUsage } = require('./usageService');

/**
 * Robust text generation with model fallback
 */
async function generateText(prompt, userId) {
    if (!apiKey) throw new Error("AI API Key not set.");
    if (!userId) throw new Error("Login to use AI features.");

    // 1. Quota Check
    const hasQuota = await checkQuota(userId, 'GEMINI');
    if (!hasQuota) {
        throw new Error("Daily AI usage limit reached (3 requests/day). Please try again tomorrow.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 2. Fallback Chain
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro"
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`🤖 Attempting AI generation with model: ${modelName}`);
            const modelInstance = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
            const result = await modelInstance.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            if (text) {
                console.log(`✅ AI success with ${modelName}`);
                await incrementUsage(userId, 'GEMINI');
                return text;
            }
        } catch (error) {
            console.warn(`⚠️ Model ${modelName} failed: ${error.message}`);
            lastError = error;
            continue; // Try next model
        }
    }

    console.error("❌ All AI models failed.");
    throw lastError || new Error("AI service currently unavailable. Please try again later.");
}

module.exports = {
    generateText
};
