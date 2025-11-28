// utils/xpUtils.js

const { getData, saveData } = require('./db');
const config = require('../config');
const { getNextLevelXp } = require('./xpFormulas'); // <-- Ora il require funziona

const XP_TICK_INTERVAL_MS = config.XP_TICK_INTERVAL_MIN * 60 * 1000;
const DAYZ_XP_PER_TICK = config.XP_GAINS.DAYZ_PLAYING;

/**
 * Funzione per trovare il ruolo di livello più alto che un utente si merita in base al suo livello.
 * @param {number} currentLevel Il livello attuale dell'utente.
 * @returns {string|null} L'ID del ruolo target o null se non merita un ruolo.
 */
function getTargetRoleId(currentLevel) {
    const levelRoles = config.ROLES.LEVEL_ROLES;
    let targetRoleId = null;

    // Itera sui ruoli in ordine per trovare il più alto che l'utente si merita
    // Si assume che config.ROLES.LEVEL_ROLES sia ordinato per Livello (chiave) crescente.
    for (const [level, roleId] of Object.entries(levelRoles)) {
        if (currentLevel >= parseInt(level)) {
            targetRoleId = roleId;
        }
    }
    return targetRoleId;
}


/**
 * Verifica l'XP di un membro e assegna o rimuove i ruoli di grado necessari.
 * Gestisce sia la promozione che la retrocessione (demotion).
 * @param {GuildMember} member Il membro Discord da controllare.
 * @param {number} currentLevel Il livello attuale del membro.
 * @param {Client} client L'istanza del client Discord.
 */
async function checkAndSetRank(member, currentLevel, client) {
    const guildRoles = config.ROLES.LEVEL_ROLES;
    const targetRoleId = getTargetRoleId(currentLevel);

    if (!member.guild) return;

    // 1. Pulizia: Rimuovi tutti i ruoli di livello che non sono il ruolo target
    for (const roleId of Object.values(guildRoles)) {
        if (member.roles.cache.has(roleId) && roleId !== targetRoleId) {
            await member.roles.remove(roleId).catch(err => console.error(`[XP ERROR] Errore rimozione ruolo ${roleId}: ${err.message}`));
            const removedRole = member.guild.roles.cache.get(roleId)?.name;
            const targetRole = member.guild.roles.cache.get(targetRoleId)?.name || "Nessun Grado";
            console.log(`[XP] Rimosso il grado ${removedRole} da ${member.user.tag} (Grado Attuale: ${targetRole})`);
        }
    }

    // 2. Promozione: Aggiungi il ruolo target se esiste e l'utente non lo ha
    if (targetRoleId) {
        if (!member.roles.cache.has(targetRoleId)) {
            await member.roles.add(targetRoleId).catch(err => console.error(`[XP ERROR] Errore aggiunta ruolo ${targetRoleId}: ${err.message}`));
            const roleName = member.guild.roles.cache.get(targetRoleId)?.name;
            console.log(`[XP] Promosso ${member.user.tag} al grado: ${roleName}`);
            // [OPZIONALE: Invia messaggio di promozione se desiderato]
        }
    }
}


/**
 * Aggiorna i dati XP e livello di un membro e chiama la funzione per aggiornare il grado.
 * @param {GuildMember} member Il membro Discord da aggiornare.
 * @param {number} xpAmount L'ammontare di XP da aggiungere (o sottrarre se negativo).
 * @param {Client} client L'istanza del client Discord.
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
    
    // Aggiorna XP
    xp += xpAmount;

    // Impedisci XP negativi
    if (xp < 0) xp = 0;

    // --- Calcolo del nuovo livello ---
    let newLevel = level;

    // A. Controlla salita di livello
    while (xp >= getNextLevelXp(newLevel)) {
        newLevel++;
    }

    // B. Controlla discesa di livello (per retrocessione)
    // Se l'XP è sceso, dobbiamo ricalcolare il livello massimo raggiunto con quell'XP
    if (xpAmount < 0) {
        newLevel = 0;
        let cumulativeXp = 0;
        
        while (true) {
            const xpForNextLevel = getNextLevelXp(newLevel);
            if (xp >= xpForNextLevel) {
                newLevel++;
                // Per un ricalcolo più preciso del livello, si dovrebbe usare la formula inversa o un loop
                // Semplificazione: se l'XP è sceso sotto il requisito per il livello attuale, abbassa il livello.
                // In questo caso, il loop while(xp >= getNextLevelXp(newLevel)) è sufficiente se si parte da newLevel=0
                // Lo resetto e lo ricalcolo completamente:
                newLevel = 0;
                while (xp >= getNextLevelXp(newLevel)) {
                     newLevel++;
                }
                break;
            } else {
                break;
            }
        }
    }
    
    // Se il livello è cambiato, o se stiamo gestendo una sottrazione di XP, aggiorna i dati e il grado.
    if (newLevel !== originalLevel || xpAmount < 0) {
        levelsData[userId] = { xp, level: newLevel };
        saveData(config.FILES.LEVELS, levelsData);

        // Chiama la funzione che gestisce la promozione/retrocessione del ruolo
        checkAndSetRank(member, newLevel, client);
    } else {
        levelsData[userId] = { xp, level: newLevel };
        saveData(config.FILES.LEVELS, levelsData);
    }
}

/**
 * Loop principale che verifica i membri che giocano a DayZ e aggiunge XP.
 * @param {Client} client L'istanza del client Discord.
 */
function xpTickLoop(client) {
    console.log(`⏱ Loop XP DayZ avviato.`);

    setInterval(async () => {
        try {
            const guild = client.guilds.cache.get(config.SERVER_ID);
            if (!guild) return;

            // Fetch dei membri del server per verificare la presenza
            const members = await guild.members.fetch().catch(() => null);
            if (!members) return;

            members.forEach(member => {
                if (client.isPlayingDayZ(member)) {
                    // Aggiunge XP solo se il membro sta giocando a DayZ
                    updateMemberXp(member, DAYZ_XP_PER_TICK, client);
                }
            });

        } catch (error) {
            console.error("Errore nel loop XP DayZ:", error);
        }
    }, XP_TICK_INTERVAL_MS);
}

module.exports = {
    xpTickLoop,
    updateMemberXp,
};
