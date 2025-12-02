// config.js

module.exports = {
    // ------------------------------------------------------------
    // CONFIGURAZIONE BASE DEL BOT
    // ------------------------------------------------------------
    PREFIX: '/', 

    // ------------------------------------------------------------
    // CONFIGURAZIONE SISTEMA XP E LIVELING
    // ------------------------------------------------------------
    XP_GAINS: {
        GAME_NAME_TO_TRACK: "DayZ", 
        XP_PER_TICK: 25, 
        XP_PER_MESSAGE: 15, 
        TICK_INTERVAL_MS: 5 * 60 * 1000, // Deve essere un numero (300000 ms)
    },

    LEVEL_UP_ANNOUNCEMENT_CHANNEL_ID: "INSERISCI_ID_CANALE_ANNUNCI", 
    
    // ⭐ ⭐ LA TUA LISTA DI RUOLI DI LIVELLO ⭐ ⭐
    LEVEL_ROLES: [
        { level: 0, roleId: "1442570652228784240" }, // Fresh Spawn
        { level: 1, roleId: "1442570651696107711" }, // Survivor
        { level: 5, roleId: "1442570650584875019" }, // Veteran Raider
        { level: 10, roleId: "1442570649724784671" }, // Field Officer
        { level: 15, roleId: "1442570648705568798" }, // Command Unit
        { level: 20, roleId: "1442570648022024292" }  // Overlord
    ],

    // ------------------------------------------------------------
    // CONFIGURAZIONE SISTEMA AI (GEMINI)
    // ------------------------------------------------------------
    AI_CATEGORY_NAME: "🤖 | AI SESSIONS", 
    AI_SESSION_TIMEOUT_MINUTES: 30, 
    AI_SESSION_TIMEOUT_MS: 30 * 60 * 1000, // Deve essere un numero
    AI_CLEANUP_LOOP_MINUTES: 5, // Deve essere un numero
    GEMINI_MODEL: "gemini-2.5-flash", 
    
    // ------------------------------------------------------------
    // CONFIGURAZIONE SISTEMA TICKET (Placeholder)
    // ------------------------------------------------------------
    TICKET_CATEGORY_ID: "1442842746032230410", 
    TICKET_TYPES: {
        // 1. Supporto Generale / General Support
        'support': { label: 'Richiesta di Supporto / General Support', emoji: '❓' },
        
        // 2. Segnalazione Utente / User Report
        'report': { label: 'Segnala un Utente / User Report', emoji: '🚨' },
        
        // ⭐ 3. Segnalazione Bug / Bug Report (NUOVO) ⭐
        'bug': { label: 'Segnalazione Bug / Bug Report', emoji: '🐛' },
        
        // ⭐ 4. Richiesta di Sban / Ban Appeal (NUOVO) ⭐
        'ban_appeal': { label: 'Richiesta di Sban / Ban Appeal', emoji: '⚖️' },
    },

    // ------------------------------------------------------------
    // CONFIGURAZIONE PERMESSI E RUOLI
    // ------------------------------------------------------------
    ADMIN_ROLES: ["441203826322702347"], 
    MODERATOR_ROLES: ["1442570652228784240"], 
    // config.js (Aggiungi questa linea)
    ROLE_ID_VERIFIED: "INSERISCI_QUI_L'ID_DEL_RUOLO",
    // ------------------------------------------------------------
    // CONFIGURAZIONE PATH FILE (Database Locali)
    // ------------------------------------------------------------
    FILES: {
        LEVELS: 'levels.json',
        PERMISSIONS: 'permissions.json',
        AI_SESSIONS: 'ai_sessions.json',
        SERVER_CONFIG: 'serverconfig.json'
    }
};
