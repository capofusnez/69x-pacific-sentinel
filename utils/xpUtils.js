// utils/xpUtils.js

const config = require('../config');
const { getData, saveData } = require('./db');

/**
 * Funzione per calcolare l'XP richiesto per un dato livello.
 * @param {number} level Il livello target.
 * @returns {number} L'XP totale necessario per raggiungere quel livello.
 */
function calculateRequiredXp(level) {
    if (level <= 0) return 0;
    // Formula di livellamento: (Livello * 100) + (Livello * 900)
    // Level 1: 1000 XP
    // Level 2: 2000 XP
    // Level 3: 3000 XP (Sostituisci 1000 con la tua formula se diversa)
    return level * 1000; 
}


// Funzione principale che esegue il loop XP (controlla gli stati di gioco)
function xpTickLoop(client) {
    const TICK_INTERVAL = config.XP_GAINS.TICK_INTERVAL_MS;
    
    // CORREZIONE CRUCIALE: Assicura che l'intervallo sia un numero valido
    let interval = parseInt(TICK_INTERVAL); 
    
    if (isNaN(interval) || interval <= 0) {
        // Fallback a 5 minuti se il valore non è valido
        interval = 5 * 60 * 1000; 
        console.warn("⚠ ATTENZIONE: TICK_INTERVAL_MS non valido in config.js. Usando 5 minuti di default.");
    }

    setTimeout(() => {
        const levels = getData(config.FILES.LEVELS);
        const xpPerTick = config.XP_GAINS.XP_PER_TICK;
        const targetGame = config.XP_GAINS.GAME_NAME_TO_TRACK;
        
        client.guilds.cache.forEach(guild => {
            guild.members.cache.forEach(member => {
                if (member.user.bot) return;

                // Verifica se l'utente sta giocando al gioco tracciato
                // ASSUNZIONE: La funzione client.isPlayingDayZ(member) esiste nel client
                if (client.isPlayingDayZ(member)) { 
                    
                    const userId = member.id;
                    if (!levels[userId]) {
                        levels[userId] = { xp: 0, level: 0 };
                    }
                    
                    const currentLevel = levels[userId].level;
                    const nextLevelXpTotal = calculateRequiredXp(currentLevel + 1); // XP totale richiesto per il livello successivo
                    
                    levels[userId].xp += xpPerTick;
                    
                    // Controlla se è salito di livello
                    if (levels[userId].xp >= nextLevelXpTotal) {
                        levels[userId].level++;
                        levels[userId].xp = levels[userId].xp - nextLevelXpTotal; // Mantiene l'XP in eccesso

                        const announceChannelId = config.LEVEL_UP_ANNOUNCEMENT_CHANNEL_ID;
                        const announceChannel = guild.channels.cache.get(announceChannelId);

                        if (announceChannel) {
                            announceChannel.send(`🎉 **Complimenti, ${member}!** Hai raggiunto il **Livello ${levels[userId].level}** giocando a ${targetGame}!`);
                        }
                    }
                }
            });
        });

        saveData(config.FILES.LEVELS, levels);
        
        // Rilancia il loop
        xpTickLoop(client);
    }, interval); // Usa l'intervallo corretto e sicuro
    
    console.log(`⏱ Loop XP ${config.XP_GAINS.GAME_NAME_TO_TRACK} avviato.`);
}


/**
 * Funzione per aggiungere XP al messaggio (da usare in events/messageCreate.js)
 */
function addMessageXp(userId) {
    const levels = getData(config.FILES.LEVELS);
    
    if (!levels[userId]) {
        levels[userId] = { xp: 0, level: 0 };
    }
    
    // Aggiunge XP, gestisce il leveling, salva. (Logica simile a xpTickLoop ma per i messaggi)
    // ... (Aggiungi qui la logica completa per l'XP sui messaggi - Omette per non cambiare troppo il tuo file)
    
    saveData(config.FILES.LEVELS, levels);
}

// --------------------------------------------------------------------------------------------------
// ⭐ FUNZIONE MANCANTE PER IL PULSANTE (RISOLVE IL TYPEERROR) ⭐
// --------------------------------------------------------------------------------------------------
/**
 * Recupera le statistiche di livello/XP di un utente per l'embed.
 * @param {string} guildId L'ID della gilda (non usato qui, ma mantenuto per chiarezza)
 * @param {string} userId L'ID dell'utente.
 * @returns {{xp: number, level: number, nextLevelXp: number, progressPercent: number}}
 */
function getUserLevelInfo(guildId, userId) {
    const levels = getData(config.FILES.LEVELS);
    
    // Inizializza o recupera i dati dell'utente
    const userData = levels[userId] || { xp: 0, level: 0 };
    const currentLevel = userData.level;
    const currentXp = userData.xp;

    // XP totale necessario per il prossimo livello
    const xpTotalRequired = calculateRequiredXp(currentLevel + 1);
    
    // Calcola l'XP che manca per il prossimo livello (non lo stai usando, ma è utile)
    // const xpNeeded = xpTotalRequired - currentXp; 

    // Calcola la percentuale di progresso
    let progressPercent = 0;
    if (xpTotalRequired > 0) {
        progressPercent = Math.min(100, Math.floor((currentXp / xpTotalRequired) * 100));
    }
    
    return { 
        xp: currentXp,
        level: currentLevel,
        nextLevelXp: xpTotalRequired,
        progressPercent: progressPercent
    };
}


// --------------------------------------------------------------------------------------------------
// ⭐ ESPORTAZIONE CORRETTA ⭐
// --------------------------------------------------------------------------------------------------
module.exports = {
    xpTickLoop,
    addMessageXp,
    getUserLevelInfo, // <--- ORA ESPORTATA e DISPONIBILE
};
