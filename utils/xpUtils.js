// utils/xpUtils.js

const config = require('../config');
const { getData, saveData } = require('./db');

// La flag Ephemeral è rappresentata dal valore numerico 64.
const EPHEHEMERAL_FLAG = 64; 

/**
 * Funzione per calcolare l'XP richiesto per un dato livello.
 * @param {number} level Il livello target.
 * @returns {number} L'XP totale necessario per raggiungere quel livello.
 */
function calculateRequiredXp(level) {
    if (level <= 0) return 0;
    // Assunzione: 1000 XP per ogni livello
    return level * 1000; 
}

// Funzione principale che esegue il loop XP (controlla gli stati di gioco)
function xpTickLoop(client) {
    const TICK_INTERVAL = config.XP_GAINS.TICK_INTERVAL_MS;
    
    let interval = parseInt(TICK_INTERVAL); 
    
    if (isNaN(interval) || interval <= 0) {
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

                if (client.isPlayingDayZ(member)) { 
                    
                    const userId = member.id;
                    if (!levels[userId]) {
                        levels[userId] = { xp: 0, level: 0 };
                    }
                    
                    const currentLevel = levels[userId].level;
                    const nextLevelXpTotal = calculateRequiredXp(currentLevel + 1);
                    
                    levels[userId].xp += xpPerTick;
                    
                    if (levels[userId].xp >= nextLevelXpTotal) {
                        levels[userId].level++;
                        levels[userId].xp = levels[userId].xp - nextLevelXpTotal;

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
        
        xpTickLoop(client);
    }, interval); 
    
    console.log(`⏱ Loop XP ${config.XP_GAINS.GAME_NAME_TO_TRACK} avviato.`);
}


/**
 * Funzione per aggiungere XP manualmente (usata da /xp-add).
 * @param {string} userId - L'ID dell'utente.
 * @param {number} amount - La quantità di XP da aggiungere.
 */
function addXP(userId, amount) {
    const levels = getData(config.FILES.LEVELS);
    
    if (!levels[userId]) {
        levels[userId] = { xp: 0, level: 0 };
    }
    
    levels[userId].xp += amount;
    
    // NOTA: Idealmente, qui andrebbe un check per il level up.
    
    saveData(config.FILES.LEVELS, levels);
    
    return levels[userId];
}

/**
 * Funzione per aggiungere XP al messaggio (da usare in events/messageCreate.js)
 */
function addMessageXp(userId) {
    // ... (Aggiungi qui la logica completa per l'XP sui messaggi - Sostituisci con la tua logica)
    addXP(userId, config.XP_GAINS.XP_PER_MESSAGE || 10);
}


/**
 * Recupera le statistiche di livello/XP di un utente per l'embed.
 * @param {string} guildId L'ID della gilda (non usato qui, ma mantenuto per chiarezza)
 * @param {string} userId L'ID dell'utente.
 * @returns {{xp: number, level: number, nextLevelXp: number, progressPercent: number}}
 */
function getUserLevelInfo(guildId, userId) {
    const levels = getData(config.FILES.LEVELS);
    
    const userData = levels[userId] || { xp: 0, level: 0 };
    const currentLevel = userData.level;
    const currentXp = userData.xp;

    const xpTotalRequired = calculateRequiredXp(currentLevel + 1);
    
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


// ⭐ ESPORTAZIONE CORRETTA ⭐
module.exports = {
    xpTickLoop,
    addMessageXp,
    getUserLevelInfo,
    addXP, // <-- ESSENZIALE PER IL COMANDO XP-ADD
};
