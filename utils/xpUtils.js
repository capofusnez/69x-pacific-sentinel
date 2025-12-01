// utils/xpUtils.js

const { getData, saveData } = require('./db');
const config = require('../config');
const { getNextLevelXp } = require('./xpFormulas');

const XP_TICK_INTERVAL_MS = config.XP_TICK_INTERVAL_MIN * 60 * 1000;
const DAYZ_XP_PER_TICK = config.XP_GAINS.DAYZ_PLAYING;

/**
 * Funzione per trovare il ruolo di livello più alto che un utente si merita.
 */
function getTargetRoleId(currentLevel) {
    const levelRoles = config.RANK_ROLES || []; // Usa l'array RANK_ROLES dal config
    let targetRoleId = null;

    // Assumiamo che RANK_ROLES sia un array di oggetti { level, roleId }
    // Lo ordiniamo per sicurezza
    const sortedRoles = [...levelRoles].sort((a, b) => a.level - b.level);

    for (const roleData of sortedRoles) {
        if (currentLevel >= roleData.level) {
            targetRoleId = roleData.roleId;
        }
    }
    return targetRoleId;
}

/**
 * Verifica l'XP di un membro e gestisce Promozione/Retrocessione.
 */
async function checkAndSetRank(member, currentLevel, client) {
    // Adatta la lettura dei ruoli alla nuova struttura array di config.js
    const rankRoles = config.RANK_ROLES || [];
    const targetRoleId = getTargetRoleId(currentLevel);

    if (!member.guild) return;

    // 1. Pulizia: Rimuovi ruoli di livello sbagliati
    for (const r of rankRoles) {
        if (member.roles.cache.has(r.roleId) && r.roleId !== targetRoleId) {
            await member.roles.remove(r.roleId).catch(err => console.error(`[XP ERROR] Rimozione ruolo fallita: ${err.message}`));
        }
    }

    // 2. Promozione: Aggiungi il ruolo corretto
    if (targetRoleId) {
        if (!member.roles.cache.has(targetRoleId)) {
            await member.roles.add(targetRoleId).catch(err => console.error(`[XP ERROR] Aggiunta ruolo fallita: ${err.message}`));
            console.log(`[XP] Grado aggiornato per ${member.user.tag}`);
        }
    }
}

/**
 * Recupera le informazioni di livello di un utente (PER IL COMANDO /CHECK O PULSANTE)
 * QUESTA ERA LA FUNZIONE MANCANTE!
 */
function getUserLevelInfo(guildId, userId) {
    const levelsData = getData(config.FILES.LEVELS);
    
    if (!levelsData[userId]) {
        return { xp: 0, level: 0, nextLevelXp: 100, progressPercent: 0 };
    }

    const { xp, level } = levelsData[userId];
    
    // Calcoli per la barra di progresso
    const xpForNextLevel = getNextLevelXp(level);
    const xpForCurrentLevel = level > 0 ? getNextLevelXp(level - 1) : 0;
    
    const xpInCurrentLevel = xp - xpForCurrentLevel;
    const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
    
    let progressPercent = Math.floor((xpInCurrentLevel / xpNeededForLevel) * 100);
    if (progressPercent < 0) progressPercent = 0;
    if (progressPercent > 100) progressPercent = 100;

    return {
        xp,
        level,
        nextLevelXp: xpForNextLevel,
        progressPercent
    };
}

/**
 * Aggiorna XP e Livello
 */
function updateMemberXp(member, xpAmount, client) {
    if (member.user.bot) return;

    const levelsData = getData(config.FILES.LEVELS);
    const userId = member.id;

    if (!levelsData[userId]) {
        levelsData[userId] = { xp: 0, level: 0 };
    }

    let { xp, level } = levelsData[userId];
    let originalLevel = level;
    
    xp += xpAmount;
    if (xp < 0) xp = 0;

    let newLevel = level;

    // Calcolo Livello (Salita)
    while (xp >= getNextLevelXp(newLevel)) {
        newLevel++;
    }

    // Calcolo Livello (Discesa - Retrocessione)
    if (xpAmount < 0) {
        newLevel = 0;
        while (xp >= getNextLevelXp(newLevel)) {
             newLevel++;
        }
    }
    
    if (newLevel !== originalLevel || xpAmount < 0) {
        levelsData[userId] = { xp, level: newLevel };
        saveData(config.FILES.LEVELS, levelsData);
        checkAndSetRank(member, newLevel, client);
    } else {
        levelsData[userId] = { xp, level: newLevel };
        saveData(config.FILES.LEVELS, levelsData);
    }
}

/**
 * Loop XP DayZ
 */
function xpTickLoop(client) {
    console.log(`⏱ Loop XP DayZ avviato.`);

    setInterval(async () => {
        try {
            const guild = client.guilds.cache.get(config.SERVER_ID);
            if (!guild) return;

            const members = await guild.members.fetch().catch(() => null);
            if (!members) return;

            members.forEach(member => {
                if (client.isPlayingDayZ(member)) {
                    updateMemberXp(member, DAYZ_XP_PER_TICK, client);
                }
            });

        } catch (error) {
            console.error("Errore nel loop XP DayZ:", error);
        }
    }, XP_TICK_INTERVAL_MS);
}

// ESPORTAZIONI (ORA INCLUDE getUserLevelInfo)
module.exports = {
    xpTickLoop,
    updateMemberXp,
    getUserLevelInfo 
};
