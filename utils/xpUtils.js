// utils/xpUtils.js

const config = require('../config');
// Assumi che './db' contenga le tue funzioni getData e saveData (es. da un file db.js)
const { getData, saveData } = require('./db'); 

// --- Funzioni di calcolo ---

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

// --- Funzione cruciale: Gestione Ruoli ---

/**
 * Aggiorna il ruolo di livello dell'utente in base al suo nuovo livello.
 * Rimuove i ruoli di livello precedenti e aggiunge quello più alto idoneo.
 * @param {GuildMember} member - L'oggetto membro da aggiornare.
 * @param {number} newLevel - Il livello raggiunto dall'utente.
 */
async function updateUserRole(member, newLevel) {
    if (!config.LEVEL_ROLES || config.LEVEL_ROLES.length === 0) {
        console.warn("⚠ LEVEL_ROLES non configurato in config.js. Salto l'aggiornamento dei ruoli.");
        return;
    }
    
    // ⭐ LOG DI DEBUG INIZIALE ⭐
    console.log(`[DEBUG RUOLI] Aggiornamento ruoli per: ${member.user.tag}. Livello raggiunto: ${newLevel}`);
    console.log(`[DEBUG RUOLI] Ruoli attuali del membro: ${member.roles.cache.map(r => r.name).join(', ')}`);


    // 1. Trova il ruolo di livello più alto che l'utente è idoneo a ricevere
    const eligibleRoles = config.LEVEL_ROLES
        .filter(roleConfig => newLevel >= roleConfig.level)
        .sort((a, b) => b.level - a.level); // Ordina per livello decrescente (dal più alto al più basso)

    if (eligibleRoles.length === 0) return; 

    const highestEligibleRoleId = eligibleRoles[0].roleId;
    
    // 2. Identifica tutti gli ID dei ruoli di livello definiti in config
    const allLevelRoleIds = config.LEVEL_ROLES.map(r => r.roleId);

    // 3. Ruoli da rimuovere: ruoli di livello che l'utente ha E che NON sono il ruolo massimo idoneo
    const rolesToRemove = member.roles.cache
        .filter(role => allLevelRoleIds.includes(role.id) && role.id !== highestEligibleRoleId)
        .map(role => role.id);
    
    console.log(`[DEBUG RUOLI] Ruolo più alto da assegnare: ${member.guild.roles.cache.get(highestEligibleRoleId)?.name || highestEligibleRoleId}`);
    console.log(`[DEBUG RUOLI] Ruoli da rimuovere prima dell'assegnazione: ${rolesToRemove.map(id => member.guild.roles.cache.get(id)?.name || id).join(', ')}`);

    try {
        // 4. Rimuovi i ruoli di livello precedenti
        if (rolesToRemove.length > 0) {
            await member.roles.remove(rolesToRemove, 'Livello superato: rimozione ruolo precedente');
        }

        // 5. Aggiungi il nuovo ruolo (solo se non lo ha già)
        if (!member.roles.cache.has(highestEligibleRoleId)) {
            await member.roles.add(highestEligibleRoleId, 'Assegnazione nuovo ruolo di livello');
        }
        
        console.log(`[DEBUG RUOLI] Operazione ruoli completata con successo.`);
        
    } catch (e) {
        // ⭐ LOG DI ERRORE DETTAGLIATO ⭐
        console.error(`❌ [ERRORE FATALE RUOLI] Fallimento nell'aggiornamento dei ruoli per ${member.user.tag}:`, e.message);
        console.error("Motivo probabile: Permessi mancanti (controlla Gerarchia Ruolo BOT e permessi 'Gestisci Ruoli').");
    }
}


// --- Funzione principale Loop XP ---

/**
 * Funzione principale che esegue il loop XP (controlla gli stati di gioco)
 * Utilizza for...of e await per gestire i ruoli.
 * @param {Client} client - L'oggetto client di Discord.
 */
function xpTickLoop(client) {
    const TICK_INTERVAL = config.XP_GAINS.TICK_INTERVAL_MS;
    
    let interval = parseInt(TICK_INTERVAL); 
    
    if (isNaN(interval) || interval <= 0) {
        interval = 5 * 60 * 1000; 
    }

    setTimeout(async () => { // Aggiunto 'async' per usare 'await'
        const levels = getData(config.FILES.LEVELS);
        const xpPerTick = config.XP_GAINS.XP_PER_TICK;
        const targetGame = config.XP_GAINS.GAME_NAME_TO_TRACK;
        
        // Deve usare for...of per l'await
        for (const [guildId, guild] of client.guilds.cache) { 
            
            // Fetch di tutti i membri per assicurarsi che la cache sia aggiornata (necessario per la presenza)
            await guild.members.fetch({ withPresences: true }).catch(console.error);

            for (const [memberId, member] of guild.members.cache) {
                
                if (member.user.bot) continue;

                // client.isPlayingDayZ è definito in index.js
                if (client.isPlayingDayZ(member)) { 
                    
                    const userId = member.id;
                    if (!levels[userId]) {
                        levels[userId] = { xp: 0, level: 0 };
                    }
                    
                    // RICALCOLA IL LIVELLO CORRETTO DALL'XP SALVATO
                    const currentLevel = calculateLevel(levels[userId].xp); 
                    levels[userId].level = currentLevel; // Aggiorna il campo level per coerenza
                    
                    const nextLevelXpTotal = calculateRequiredXp(currentLevel + 1);
                    
                    levels[userId].xp += xpPerTick;
                    
                    // Controlla se l'XP accumulato supera la soglia del livello successivo
                    if (levels[userId].xp >= nextLevelXpTotal) {
                        
                        // Determina il nuovo livello dopo l'incremento
                        const newLevel = calculateLevel(levels[userId].xp);

                        // Gestisce il Level Up se il livello è effettivamente cambiato
                        if (newLevel > currentLevel) {
                            levels[userId].level = newLevel;

                            // ⭐ CHIAMATA CRUCIALE: Aggiorna il ruolo ⭐
                            await updateUserRole(member, newLevel); 

                            const announceChannelId = config.LEVEL_UP_ANNOUNCEMENT_CHANNEL_ID;
                            const announceChannel = guild.channels.cache.get(announceChannelId);

                            if (announceChannel) {
                                announceChannel.send(`🎉 **Complimenti, ${member}!** Hai raggiunto il **Livello ${newLevel}** giocando a ${targetGame}!`);
                            }
                        }
                    }
                }
            }
        }

        saveData(config.FILES.LEVELS, levels);
        
        xpTickLoop(client);
    }, interval); 
    
    console.log(`⏱ Loop XP ${config.XP_GAINS.GAME_NAME_TO_TRACK} avviato.`);
}


// --- Altre Funzioni XP ---

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
    
    // Nota: L'aggiornamento dei ruoli non viene fatto qui per non rallentare l'app. 
    // Verrà gestito dal xpTickLoop o da un'eventuale successiva chiamata.
    
    saveData(config.FILES.LEVELS, levels);
    
    return levels[userId];
}

/**
 * Funzione per aggiungere XP al messaggio (da usare in events/messageCreate.js)
 */
function addMessageXp(userId) {
    addXP(userId, config.XP_GAINS.XP_PER_MESSAGE || 10);
}


/**
 * Recupera le statistiche di livello/XP di un utente per l'embed.
 * ⭐ RISOLVE L'ERRORE DEL LIVELLO 0 ⭐
 * @param {string} guildId L'ID della gilda 
 * @param {string} userId L'ID dell'utente.
 * @returns {{xp: number, level: number, nextLevelXp: number, progressPercent: number}}
 */
function getUserLevelInfo(guildId, userId) {
    const levels = getData(config.FILES.LEVELS);
    
    const userData = levels[userId] || { xp: 0, level: 0 };
    const currentXp = userData.xp;

    // CORREZIONE CRUCIALE: Ricalcola il livello esatto in base all'XP totale salvato
    const correctLevel = calculateLevel(currentXp); 

    const xpTotalRequiredForNext = calculateRequiredXp(correctLevel + 1);
    
    const xpPassedLastLevel = currentXp - calculateRequiredXp(correctLevel);

    let progressPercent = 0;
    const xpDifferenceForCurrentLevel = xpTotalRequiredForNext - calculateRequiredXp(correctLevel); 

    if (xpDifferenceForCurrentLevel > 0) {
        progressPercent = Math.min(100, Math.floor((xpPassedLastLevel / xpDifferenceForCurrentLevel) * 100));
    }
    
    return { 
        xp: currentXp,
        level: correctLevel, 
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
    updateUserRole, 
    calculateLevel // Utile per i comandi che devono ricalcolare il livello
};
