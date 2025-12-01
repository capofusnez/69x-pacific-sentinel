// utils/xpUtils.js

const config = require('../config');
const { getData, saveData } = require('./db');

/**
 * Funzione per calcolare l'XP totale richiesto per raggiungere un dato livello.
 * @param {number} level Il livello target.
 * @returns {number} L'XP totale necessario per raggiungere quel livello.
 */
function calculateRequiredXp(level) {
    if (level <= 0) return 0;
    // Assunzione: 1000 XP per ogni livello
    return level * 1000; 
}

/**
 * Calcola il livello attuale in base all'XP totale accumulato.
 * @param {number} totalXp - L'XP totale dell'utente.
 * @returns {number} Il livello esatto.
 */
function calculateLevel(totalXp) {
    if (totalXp < 1000) return 0;
    
    // Calcola il livello dividendo l'XP totale per l'XP richiesto per livello (1000)
    return Math.floor(totalXp / 1000); 
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
 * Funzione per aggiungere XP manualmente (usata da /xp-add) o tramite messaggi.
 * @param {string} userId - L'ID dell'utente.
 * @param {number} amount - La quantità di XP da aggiungere.
 */
function addXP(userId, amount) {
    const levels = getData(config.FILES.LEVELS);
    
    if (!levels[userId]) {
        levels[userId] = { xp: 0, level: 0 };
    }
    
    levels[userId].xp += amount;
    
    // Potenziale logica di Level Up qui, ma per non complicare la logica la manteniamo nel loop XP/tick
    
    saveData(config.FILES.LEVELS, levels);
    
    return levels[userId];
}

/**
 * Funzione per aggiungere XP al messaggio (da usare in events/messageCreate.js)
 */
function addMessageXp(userId) {
    // Sostituisci con la tua logica di guadagno XP da messaggio
    addXP(userId, config.XP_GAINS.XP_PER_MESSAGE || 10);
}


/**
 * Recupera le statistiche di livello/XP di un utente per l'embed.
 * ⭐ RISOLVE L'ERRORE DEL LIVELLO 0 ⭐
 * @param {string} guildId L'ID della gilda (non usato qui, ma mantenuto per chiarezza)
 * @param {string} userId L'ID dell'utente.
 * @returns {{xp: number, level: number, nextLevelXp: number, progressPercent: number}}
 */
function getUserLevelInfo(guildId, userId) {
    const levels = getData(config.FILES.LEVELS);
    
    const userData = levels[userId] || { xp: 0, level: 0 };
    const currentXp = userData.xp;

    // ⭐ CORREZIONE CRUCIALE: Ricalcola il livello esatto in base all'XP totale salvato
    const correctLevel = calculateLevel(currentXp); 

    // XP totale necessario per raggiungere il livello successivo
    const xpTotalRequiredForNext = calculateRequiredXp(correctLevel + 1);
    
    // XP accumulato OLTRE l'ultimo livello raggiunto (per la barra di progresso)
    const xpPassedLastLevel = currentXp - calculateRequiredXp(correctLevel);

    // Calcola la percentuale di progresso
    let progressPercent = 0;
    // XP richiesto per il livello attuale (differenza tra il prossimo e l'attuale, che è 1000)
    const xpDifferenceForCurrentLevel = xpTotalRequiredForNext - calculateRequiredXp(correctLevel); 

    if (xpDifferenceForCurrentLevel > 0) {
        progressPercent = Math.min(100, Math.floor((xpPassedLastLevel / xpDifferenceForCurrentLevel) * 100));
    }
    
    return { 
        xp: currentXp,
        level: correctLevel, // <-- USA IL LIVELLO RICALCOLATO
        nextLevelXp: xpTotalRequiredForNext,
        progressPercent: progressPercent
    };
}


// ⭐ ESPORTAZIONE COMPLETA ⭐
module.exports = {
    xpTickLoop,
    addMessageXp,
    getUserLevelInfo,
    addXP, 
};
