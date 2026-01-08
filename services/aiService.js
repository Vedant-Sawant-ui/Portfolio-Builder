const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize with improved error handling and fallback
const apiKey = process.env.GEMINI_API_KEY;

let model;

try {
    if (!apiKey) {
        console.warn("⚠️  WARNING: GEMINI_API_KEY is not set. AI features will fail.");
    } else {
        const genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("✅ AI Service Initialized with model: gemini-1.5-flash");
    }
} catch (error) {
    console.error("❌ Failed to initialize AI Service:", error);
}

const { checkQuota, incrementUsage } = require('./usageService');

/**
 * Generate text content from a prompt
 * @param {string} prompt 
 * @param {number} userId - Optional userId for rate limiting
 * @returns {Promise<string>}
 */
async function generateText(prompt, userId) {
    if (!model) throw new Error("AI Model not initialized");
    if (!userId) throw new Error("Login to use AI features.");
    // Check Quota if userId provided
    if (userId) {
        const hasQuota = await checkQuota(userId, 'GEMINI');
        if (!hasQuota) {
            throw new Error("Daily AI usage limit reached (3 requests/day). Please try again tomorrow.");
        }
    }
    
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Increment usage on success
        if (userId) {
            await incrementUsage(userId, 'GEMINI');
        }
        
        return text;
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error;
    }
}

module.exports = {
    generateText
};
