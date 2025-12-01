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
        TICK_INTERVAL_MS: 5 * 60 * 1000, // 300000 ms = 5 minuti
    },

    LEVEL_UP_ANNOUNCEMENT_CHANNEL_ID: "INSERISCI_ID_CANALE_ANNUNCI", 

    // ------------------------------------------------------------
    // CONFIGURAZIONE SISTEMA AI (GEMINI)
    // ------------------------------------------------------------
    AI_CATEGORY_NAME: "🤖 | AI SESSIONS", 
    AI_SESSION_TIMEOUT_MINUTES: 30, 
    AI_SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 1800000 ms = 30 minuti
    AI_CLEANUP_LOOP_MINUTES: 5, 
    GEMINI_MODEL: "gemini-2.5-flash", 
    
    // ------------------------------------------------------------
    // CONFIGURAZIONE SISTEMA TICKET (Placeholder)
    // ------------------------------------------------------------
    TICKET_CATEGORY_ID: "INSERISCI_ID_CATEGORIA_TICKET", 
    TICKET_TYPES: {
        'support': { label: 'Richiesta di Supporto', emoji: '❓' },
        'report': { label: 'Segnala un Utente/Bug', emoji: '🚨' },
    },

    // ------------------------------------------------------------
    // CONFIGURAZIONE PERMESSI E RUOLI
    // ------------------------------------------------------------
    ADMIN_ROLES: ["INSERISCI_ID_RUOLO_ADMIN"], 
    MODERATOR_ROLES: ["INSERISCI_ID_RUOLO_MODERATORE"], 

    // ------------------------------------------------------------
    // CONFIGURAZIONE PATH FILE (Database Locali)
    // Risolve l'errore "undefined caricato"
    // ------------------------------------------------------------
    FILES: {
        LEVELS: 'levels.json',
        PERMISSIONS: 'permissions.json',
        AI_SESSIONS: 'ai_sessions.json',
        SERVER_CONFIG: 'serverconfig.json',
        // Se usi rules_message, includilo. Altrimenti, NON aggiungere voci vuote.
        // RULES_MESSAGE: 'rules_message.json'
    }
};
