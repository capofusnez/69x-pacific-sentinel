// config.js
const path = require("path");

// Importa le costanti necessarie da discord.js
const { ActivityType, ButtonStyle } = require("discord.js"); 

module.exports = {
    // ------------------------------------------------------------
    // CONFIGURAZIONE GLOBALE (Da prendere da process.env)
    // ------------------------------------------------------------
    CLIENT_ID: process.env.CLIENT_ID || "1442475115743940611",
    SERVER_ID: process.env.SERVER_ID || "1442125105575628891",
    BOT_TOKEN: process.env.DISCORD_TOKEN,
    
    // ------------------------------------------------------------
    // CANALI E CATEGORIE
    // ------------------------------------------------------------
    RULES_CHANNEL_ID: process.env.RULES_CHANNEL_ID || "1442141514464759868",
    RULES_CHANNEL_NAME: "📜┃regole・rules",
    NEW_USER_CHANNEL_ID: process.env.WELCOME_CHANNEL_ID || "1442568117296562266", 
    
    SUPPORT_CATEGORY_NAME: "🆘 Supporto • Support",
    AI_CATEGORY_NAME: "🤖 AI Sessions",
    TICKET_ARCHIVE_CATEGORY_ID: process.env.TICKET_ARCHIVE_CATEGORY_ID || "1443351281145086144",
    
    // ------------------------------------------------------------
    // PERCORSI FILE DATI
    // ------------------------------------------------------------
    DATA_PATH: path.join(__dirname, "data"),
    FILES: {
        SERVER_CONFIG: "serverconfig.json",
        LEVELS: "levels.json",
        AI_SESSIONS: "ai_sessions.json",
        PERMISSIONS: "permissions.json",
        RULES_MESSAGE: "rules_message.json"
    },

    // ------------------------------------------------------------
    // SISTEMA AI
    // ------------------------------------------------------------
    GEMINI_MODEL: "gemini-2.5-flash",
    AI_SESSION_TIMEOUT_MINUTES: 30,
    AI_SESSION_TIMEOUT_MS: 30 * 60 * 1000,
    
    // ------------------------------------------------------------
    // SISTEMA XP
    // ------------------------------------------------------------

    // Intervallo di tempo tra un controllo XP e l'altro (in minuti)
    XP_TICK_INTERVAL_MIN: 5, 
    
    XP_GAINS: {
        // XP guadagnato ogni XP_TICK_INTERVAL_MIN se l'utente sta giocando a DayZ
        DAYZ_PLAYING: 25, 
        // Altri XP di base (opzionale)
        MESSAGE_SEND: 1,
        // NOME DEL GIOCO DA CERCARE NELLO STATO DI DISCORD
        GAME_NAME_TO_TRACK: 'DayZ', 
    },
    
    FRESH_SPAWN_ROLE_ID: "1442570652228784240", // Ruolo assegnato dopo l'accettazione delle regole

    // Lista dei ruoli per il sistema di livelli
    RANK_ROLES: [
        { level: 0,  name: "Fresh Spawn",   roleId: "1442570652228784240" },
        { level: 1,  name: "Survivor",      roleId: "1442570651696107711" },
        { level: 5,  name: "Veteran Raider", roleId: "1442570650584875019" },
        { level: 10, name: "Field Officer", roleId: "1442570649724784671" },
        { level: 15, name: "Command Unit",   roleId: "1442570648705568798" },
        { level: 20, name: "Overlord",      roleId: "1442570648022024292" }
    ],

    // ------------------------------------------------------------
    // TICKET
    // ------------------------------------------------------------
    TICKET_TYPES: {
        general: {
            label: "💼 Supporto Generale",
            category: 'YOUR_GENERAL_TICKET_CATEGORY_ID',
            style: ButtonStyle.Secondary
        },
        bug: {
            label: "⚙️ Segnalazione Bug",
            category: 'YOUR_BUG_TICKET_CATEGORY_ID',
            style: ButtonStyle.Danger // Rosso
        },
        report: {
            label: "🚨 Segnalazione Utente",
            category: 'YOUR_REPORT_TICKET_CATEGORY_ID',
            style: ButtonStyle.Danger
        },
        suggestions: {
            label: "💡 Suggerimento/Idea",
            category: 'YOUR_SUGGESTION_CATEGORY_ID',
            style: ButtonStyle.Success // Verde
        }
    },
}; // <-- CHIUDE L'OGGETTO module.exports
