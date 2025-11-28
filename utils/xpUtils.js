// utils/xpUtils.js

const config = require("../config");
const { getData, saveData } = require("./db");
const { ActivityType } = require("discord.js"); 

// ------------------------------------------------------------
// LOGICA XP
// ------------------------------------------------------------

/**
 * Assicura che i dati utente esistano nel file levels.json e li inizializza a xp: 0 se necessario.
 * @param {string} guildId - L'ID del server.
 * @param {string} userId - L'ID dell'utente.
 * @returns {object} I dati di tutti i livelli (levelsData).
 */
function ensureUserData(guildId, userId) {
    const levelsData = getData(config.FILES.LEVELS);
    if (!levelsData[guildId]) levelsData[guildId] = {};
    if (!levelsData[guildId][userId]) levelsData[guildId][userId] = { xp: 0 };
    return levelsData;
}

/**
 * Calcola le informazioni di livello, progresso e XP necessari dato un valore di XP totale.
 * Formula: Level = floor(sqrt(XP / 100))
 * @param {number} xp - L'XP totale dell'utente.
 * @returns {object} Informazioni dettagliate sul livello.
 */
function getLevelInfo(xp) {
    if (xp < 0) xp = 0;
    
    const level = Math.floor(Math.sqrt(xp / 100));
    const currentLevelXP = level * level * 100;
    const nextLevelXP = (level + 1) * (level + 1) * 100;
    
    const progress = xp - currentLevelXP;
    const needed = nextLevelXP - currentLevelXP;
    
    const progressPercent = needed > 0 ? Math.floor((progress / needed) * 100) : 100;
    
    return { level, xp, progress, needed, nextLevelXP, progressPercent };
}

/**
 * Aggiunge (o rimuove) XP a un utente.
 * @param {string} guildId - L'ID del server.
 * @param {string} userId - L'ID dell'utente.
 * @param {number} amount - La quantità di XP da aggiungere.
 * @returns {object} Risultato dell'operazione, incluso se c'è stato un level-up.
 */
function addXP(guildId, userId, amount) {
    if (amount === 0) return { leveledUp: false, newLevel: 0, xp: 0 };
    const levelsData = ensureUserData(guildId, userId);
    const data = levelsData[guildId][userId];

    const beforeInfo = getLevelInfo(data.xp);
    const beforeLevel = beforeInfo.level;

    data.xp += amount;
    if (data.xp < 0) data.xp = 0; // Assicura che l'XP non sia negativo

    const afterInfo = getLevelInfo(data.xp);
    const afterLevel = afterInfo.level;

    saveData(config.FILES.LEVELS, levelsData);

    return {
        leveledUp: afterLevel > beforeLevel,
        newLevel: afterLevel,
        xp: data.xp
    };
}

/**
 * Ottiene le informazioni di livello attuali per un utente.
 * @param {string} guildId - L'ID del server.
 * @param {string} userId - L'ID dell'utente.
 * @returns {object} Informazioni dettagliate sul livello.
 */
function getUserLevelInfo(guildId, userId) {
    const levelsData = getData(config.FILES.LEVELS);
    if (!levelsData[guildId] || !levelsData[guildId][userId]) {
        return getLevelInfo(0);
    }
    return getLevelInfo(levelsData[guildId][userId].xp);
}

// ------------------------------------------------------------
// LOGICA RUOLI DI RANGO
// ------------------------------------------------------------

/**
 * Aggiorna i ruoli di rango di un membro in base al suo livello.
 * @param {Guild} guild - L'oggetto Guild di Discord.
 * @param {GuildMember} member - L'oggetto GuildMember.
 * @param {number} newLevel - Il livello attuale dell'utente.
 */
async function updateRankRoles(guild, member, newLevel) {
    try {
        // Filtra i ruoli disponibili che l'utente si è guadagnato
        const availableRanks = config.RANK_ROLES.filter(r => newLevel >= r.level);
        if (availableRanks.length === 0) return;

        // Il miglior rango guadagnato (il ruolo con il livello più alto che ha raggiunto)
        const bestRank = availableRanks[availableRanks.length - 1];
        const roleToAdd = guild.roles.cache.get(bestRank.roleId);

        if (!roleToAdd) {
            console.log(`⚠ Ruolo ID "${bestRank.roleId}" (${bestRank.name}) non trovato nel server. Controlla config.js.`);
            return;
        }

        // Se ha già il ruolo corretto, non fare nulla
        if (member.roles.cache.has(roleToAdd.id)) return;

        // Rimuove tutti gli altri ruoli di rango per evitare accumuli
        for (const rank of config.RANK_ROLES) {
            if (rank.roleId === roleToAdd.id) continue;
            const oldRole = guild.roles.cache.get(rank.roleId);
            if (oldRole && member.roles.cache.has(oldRole.id)) {
                await member.roles.remove(oldRole).catch(() => {});
            }
        }

        // Aggiunge il nuovo ruolo
        await member.roles.add(roleToAdd).catch(() => {});
        console.log(`✅ Assegnato ruolo "${bestRank.name}" a ${member.user.tag} (lvl ${newLevel}).`);
    } catch (err) {
        console.error("⚠ Errore in updateRankRoles:", err);
    }
}

// ------------------------------------------------------------
// LOOP XP A TEMPO
// ------------------------------------------------------------

/**
 * Avvia il loop che controlla se gli utenti stanno giocando a DayZ e assegna XP.
 * @param {Client} client - L'oggetto Client di Discord.
 */
function xpTickLoop(client) {
    console.log("⏱ Loop XP DayZ avviato.");
    setInterval(async () => {
        try {
            const guild = client.guilds.cache.get(config.SERVER_ID);
            if (!guild) return;

            // Assicura che la cache dei membri sia piena
            await guild.members.fetch({ force: false }).catch(err => { console.error("Errore nel fetch dei membri:", err); });

            for (const member of guild.members.cache.values()) {
                if (member.user.bot) continue;

                // Controlla se il membro sta giocando a DayZ (funzione definita in index.js)
                if (client.isPlayingDayZ(member)) {
                    const result = addXP(guild.id, member.id, config.XP_PER_TICK);
                    
                    if (result.leveledUp) {
                        await updateRankRoles(guild, member, result.newLevel);
                        
                        // Opzionale: notifica l'utente/canale se vuoi fare un annuncio
                        // console.log(`🎉 ${member.user.tag} è salito al livello ${result.newLevel}!`);
                    }
                }
            }
        } catch (err) {
            console.error("⚠ Errore nel loop XP DayZ:", err);
        }
    }, config.XP_TICK_INTERVAL_MS);
}


module.exports = {
    addXP,
    getUserLevelInfo,
    updateRankRoles,
    getLevelInfo,
    xpTickLoop
};
