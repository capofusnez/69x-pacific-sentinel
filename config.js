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
        // Nome del gioco da tracciare per l'XP (DEVE corrispondere al nome Discord)
        GAME_NAME_TO_TRACK: "DayZ", 
        // XP guadagnato per ogni ciclo di presenza (in gioco)
        XP_PER_TICK: 25, 
        // XP guadagnato per messaggio
        XP_PER_MESSAGE: 15, 
        // Tempo in millisecondi tra un tick XP e l'altro (5 minuti)
        TICK_INTERVAL_MS: 5 * 60 * 1000, 
    },

    // ID del canale dove annunciare i passaggi di livello (opzionale)
    LEVEL_UP_ANNOUNCEMENT_CHANNEL_ID: "INSERISCI_ID_CANALE_ANNUNCI", 

    // ------------------------------------------------------------
    // CONFIGURAZIONE SISTEMA AI (GEMINI)
    // ------------------------------------------------------------
    // Nome della categoria dove il bot deve creare i canali AI
    AI_CATEGORY_NAME: "🤖 | AI SESSIONS", 

    // Tempo di inattività prima che un canale AI venga eliminato (in minuti)
    AI_SESSION_TIMEOUT_MINUTES: 30, 
    
    // Calcolo del tempo in millisecondi (30 min * 60 sec * 1000 ms = 1800000)
    AI_SESSION_TIMEOUT_MS: 30 * 60 * 1000, 
    
    // Frequenza con cui il bot esegue il check sui canali inattivi (in minuti)
    AI_CLEANUP_LOOP_MINUTES: 5, 
    
    // Modello AI da utilizzare (gemini-2.5-flash)
    GEMINI_MODEL: "gemini-2.5-flash", 
    
    // ------------------------------------------------------------
    // CONFIGURAZIONE SISTEMA TICKET (Placeholder)
    // ------------------------------------------------------------
    // ID della categoria dove verranno creati i canali ticket
    TICKET_CATEGORY_ID: "INSERISCI_ID_CATEGORIA_TICKET", 

    // Definisci i tipi di ticket che gli utenti possono aprire
    TICKET_TYPES: {
        'support': { label: 'Richiesta di Supporto', emoji: '❓' },
        'report': { label: 'Segnala un Utente/Bug', emoji: '🚨' },
    },

    // ------------------------------------------------------------
    // CONFIGURAZIONE PERMESSI E RUOLI
    // ------------------------------------------------------------
    // ID dei ruoli Admin (per comandi amministrativi come /ai-panel)
    ADMIN_ROLES: ["INSERISCI_ID_RUOLO_ADMIN"], 
    
    // ID dei ruoli Moderatore (per la gestione ticket)
    MODERATOR_ROLES: ["INSERISCI_ID_RUOLO_MODERATORE"], 

    // ------------------------------------------------------------
    // CONFIGURAZIONE PATH FILE (Database Locali)
    // ------------------------------------------------------------
    FILES: {
        LEVELS: 'levels.json',
        PERMISSIONS: 'permissions.json',
        AI_SESSIONS: 'ai_sessions.json',
        SERVER_CONFIG: 'serverconfig.json',
        // Se non usi rules_message.json, puoi rimuoverlo
        // RULES_MESSAGE: 'rules_message.json'
    }
};
