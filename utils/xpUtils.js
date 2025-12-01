// utils/xpUtils.js

const config = require('../config');
const { getData, saveData } = require('./db');

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
                if (client.isPlayingDayZ(member)) { 
                    
                    const userId = member.id;
                    if (!levels[userId]) {
                        levels[userId] = { xp: 0, level: 0 };
                    }
                    
                    const currentLevel = levels[userId].level;
                    const nextLevelXp = (currentLevel + 1) * 1000; // Esempio: 1000 XP per Level 1, 2000 per Level 2
                    
                    levels[userId].xp += xpPerTick;
                    
                    // Controlla se è salito di livello
                    if (levels[userId].xp >= nextLevelXp) {
                        levels[userId].level++;
                        levels[userId].xp = levels[userId].xp - nextLevelXp; // Mantiene l'XP in eccesso

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
    // ... (Aggiungi qui la logica completa per l'XP sui messaggi)
    
    saveData(config.FILES.LEVELS, levels);
}

module.exports = {
    xpTickLoop,
    addMessageXp,
};
