// utils/gemini.js

require("dotenv").config();
const config = require("../config");

let GoogleGenerativeAI = null;
let genAIModel = null;
let AI_STATUS = {
    available: false,
    reason: null
};

// ------------------------------------------------------------
// GEMINI: Inizializzazione
// ------------------------------------------------------------

try {
    ({ GoogleGenerativeAI } = require("@google/generative-ai"));
} catch (err) {
    AI_STATUS.reason = "no-module";
}

if (GoogleGenerativeAI) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
    if (!GEMINI_API_KEY) {
        AI_STATUS.reason = "no-key";
    } else {
        try {
            const gen = new GoogleGenerativeAI(GEMINI_API_KEY);
            genAIModel = gen.getGenerativeModel({ model: config.GEMINI_MODEL });
            AI_STATUS.available = true;
            console.log(`✅ Gemini (${config.GEMINI_MODEL}) inizializzato correttamente.`);
        } catch (err) {
            console.log("⚠ Errore inizializzando Gemini:", err.message);
            AI_STATUS.reason = "runtime-error";
        }
    }
}

function getAiUnavailableMessage() {
    // AGGIORNATO A SENTINEL
    return "⚠ L'assistente AI di DayZ Sentinel non è al momento disponibile. Riprova più tardi o contatta lo staff.";
}

/**
 * Invia un prompt all'AI di Gemini.
 */
async function askGemini(prompt) {
    if (!AI_STATUS.available || !genAIModel) {
        throw new Error("AI_UNAVAILABLE");
    }

    const result = await genAIModel.generateContent({
        contents: [
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ]
    });

    const text =
        result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Non ho ricevuto una risposta valida da Gemini.";
    return text;
}

module.exports = {
    AI_STATUS,
    getAiUnavailableMessage,
    askGemini
};
