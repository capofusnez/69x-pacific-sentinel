// utils/xpUtils.js

const { getData, saveData } = require('./db');
const config = require('../config');
const { getNextLevelXp } = require('./xpFormulas');

const XP_TICK_INTERVAL_MS = config.XP_TICK_INTERVAL_MIN * 60 * 1000;
const DAYZ_XP_PER_TICK = config.XP_GAINS.DAYZ_PLAYING;

/**
 * Funzione per trovare il ruolo di livello più alto che un utente si merita in base al suo XP/Livello.
 * @param {number} currentLevel Il livello attuale dell'utente.
 * @returns {string|null} L'ID del ruolo target o null se non merita un ruolo.
 */
function getTargetRoleId(currentLevel) {
    const levelRoles = config.ROLES.LEVEL_ROLES;
    let targetRoleId = null;

    // Itera sui ruoli in ordine per trovare il più alto che l'utente si merita
    for (const [level, roleId] of Object.entries(levelRoles)) {
        if (currentLevel >= parseInt(level)) {
            targetRoleId = roleId;
        }
    }
    return targetRoleId;
}


/**
 * Verifica l'XP di un membro e assegna o rimuove i ruoli di grado necessari.
 * Questa funzione gestisce sia la promozione che la retrocessione (demotion).
 * @param {GuildMember} member Il membro Discord da controllare.
 * @param {number} currentXp L'esperienza attuale del membro.
 * @param {number} currentLevel Il livello attuale del membro.
 * @param {Client} client L'istanza del client Discord.
 */
async function checkAndSetRank(member, currentXp, currentLevel, client) {
    const guildRoles = config.ROLES.LEVEL_ROLES;
    const targetRoleId = getTargetRoleId(currentLevel);

    if (!member.guild) return;

    // Se l'utente non merita alcun ruolo di livello, assicurati di rimuovere tutti i ruoli di livello
    if (!targetRoleId) {
        for (const roleId of Object.values(guildRoles)) {
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId).catch(err => console.error(`[XP ERROR] Errore rimozione ruolo ${roleId}: ${err.message}`));
            }
        }
        return;
    }

    // Processa la promozione/retrocessione
    for (const [level, roleId] of Object.entries(guildRoles)) {
        const role = member.guild.roles.cache.get(roleId);
        if (!role) continue; // Salta se il ruolo non è nel server

        if (roleId === targetRoleId) {
            // PROMOZIONE: Aggiungi il ruolo bersaglio se non lo ha
            if (!member.roles.cache.has(roleId)) {
                await member.roles.add(roleId).catch(err => console.error(`[XP ERROR] Errore aggiunta ruolo ${roleId}: ${err.message}`));
                console.log(`[XP] Promosso ${member.user.tag} al grado: ${role.name}`);
                // [OPZIONALE: Invia messaggio di promozione se desiderato]
            }
        } else {
            // RETROCESSIONE/PULIZIA: Rimuovi tutti gli altri ruoli di livello
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId).catch(err => console.error(`[XP ERROR] Errore rimozione ruolo ${roleId}: ${err.message}`));
                console.log(`[XP] Rimosso il grado ${role.name} da ${member.user.tag} (nuovo grado: ${member.guild.roles.cache.get(targetRoleId).name})`);
            }
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
    
    // Aggiorna XP
    xp += xpAmount;

    // Impedisci XP negativi
    if (xp < 0) xp = 0;

    // Calcola il nuovo livello
    let needsUpdate = false;
    let newLevel = level;
    
    // Controlla se l'utente è salito di livello
    while (xp >= getNextLevelXp(newLevel)) {
        newLevel++;
        needsUpdate = true;
    }

    // Controlla se l'utente è sceso di livello (demotion di livello XP)
    // Non è necessario un loop "while" qui, basta un ricalcolo basato sull'XP totale
    // La logica di retrocessione è già coperta dal controllo del ruolo in checkAndSetRank.
    
    // Se il livello è cambiato, o se l'XP è sceso/salito in modo significativo, controlla il ruolo
    if (newLevel !== level || needsUpdate || xpAmount < 0) {
        levelsData[userId] = { xp, level: newLevel };
        saveData(config.FILES.LEVELS, levelsData);

        // Chiama la funzione che gestisce la promozione/retrocessione del ruolo
        checkAndSetRank(member, xp, newLevel, client);
    } else {
        levelsData[userId] = { xp, level };
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
    updateMemberXp, // Utile per i comandi amministrativi come /addxp e /removexp
};
