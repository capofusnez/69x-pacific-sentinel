// utils/serverUtils.js

const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../config");
const { getData, saveData } = require("./db");
const { AI_STATUS } = require("./gemini");

// ------------------------------------------------------------
// HELPER PER REGOLE
// ------------------------------------------------------------

function getRulesText() {
    return [
        "➡️ Premi il pulsante qui sotto per accettare le regole ed entrare nel server.",
        "➡️ Click the button below to **accept the rules** and enter the server.",
        "",
        "🇮🇹 **REGOLE GENERALI**",
        "- Vietati cheat, exploit, macro, glitch.",
        "- Vietati insulti razziali, minacce reali e contenuti NSFW (ban diretto).",
        "- Duping e bug abuse = ban permanente.",
        "",
        "⚔️ **PvP / Raid**",
        "- PvP ovunque (FULL PVP).",
        "- Vietato camping eccessivo dell'eventuale safezone.",
        "- Vietato combat log intenzionale.",
        "",
        "🏠 **Base Building**",
        "- Max 1 base per team.",
        "- No basi in glitch / map holes / zone protette.",
        "- La base deve essere raidabile.",
        "",
        "🚗 **Veicoli**",
        "- Veicoli lasciati in safezone >24h possono essere rimossi.",
        "- Vietato bloccare strade o trollare con i veicoli.",
        "",
        "👥 **Staff**",
        "- Lo staff ha l'ultima parola su interpretazione delle regole.",
        "",
        "🇬🇧 **GENERAL RULES**",
        "- No cheats, exploits, macros or glitches.",
        "- No racism, real life threats or NSFW content (instant ban).",
        "- Duping and bug abuse = permanent ban.",
        "",
        "⚔️ **PvP / Raiding**",
        "- PvP everywhere (FULL PvP).",
        "- No excessive camping of any safezone.",
        "- No intentional combat log.",
        "",
        "🏠 **Base Building**",
        "- Max 1 base per team.",
        "- No bases in glitches / map holes / protected areas.",
        "- Base must be raid-able.",
        "",
        "🚗 **Vehicles**",
        "- Vehicles left in safezone >24h may be removed.",
        "- No blocking roads or trolling with vehicles.",
        "",
        "👥 **Staff**",
        "- Staff always has the final word on rules."
    ].join("\n");
}

function saveRulesMessageInfo(guildId, channelId, messageId) {
    const rulesMessageInfo = { guildId, channelId, messageId };
    saveData(config.FILES.RULES_MESSAGE, rulesMessageInfo);
}

// Funzione di utilità per creare/trovare categorie e canali (usata da setup-structure)

async function getOrCreateCategory(guild, name) {
    let cat = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name === name
    );
    if (!cat) {
        cat = await guild.channels.create({
            name,
            type: ChannelType.GuildCategory
        });
    }
    return cat;
}

async function getOrCreateTextChannel(guild, name, parentCategory) {
    let ch = guild.channels.cache.find(
        c => c.type === ChannelType.GuildText && c.name === name
    );
    if (!ch) {
        ch = await guild.channels.create({
            name,
            type: ChannelType.GuildText,
            parent: parentCategory ? parentCategory.id : null
        });
    } else if (parentCategory && ch.parentId !== parentCategory.id) {
        await ch.setParent(parentCategory.id);
    }
    return ch;
}

// ------------------------------------------------------------
// HELPER PER TICKET
// ------------------------------------------------------------

function getPermissions() {
    return getData(config.FILES.PERMISSIONS);
}

async function createTicketChannel(guild, user, typeKey = "support") {
    const typeInfo = config.TICKET_TYPES[typeKey] || config.TICKET_TYPES.support;
    const botPermissions = getPermissions();
    
    const catSupport = await getOrCreateCategory(guild, config.SUPPORT_CATEGORY_NAME);
    const baseName = `ticket-${typeKey}-${user.username}`.toLowerCase().replace(/[^a-z0-9\-]/g, "");
    const uniqueId = user.id.slice(-4);
    const channelName = `${baseName}-${uniqueId}`;

    const permissionOverwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
        },
        {
            id: user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        }
    ];

    // consenti ai ruoli staff del bot di vedere il ticket
    for (const roleId of botPermissions.allowedRoles) {
        permissionOverwrites.push({
            id: roleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        });
    }

    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: catSupport.id,
        topic: `Ticket (${typeInfo.label}) aperto da USERID: ${user.id}`,
        permissionOverwrites
    });

    const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel("🔒 Chiudi ticket / Close ticket")
            .setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
        .setTitle(`🎫 ${typeInfo.label}`)
        .setDescription(
            `🇮🇹 ${typeInfo.descriptionIt}\n` +
            `🇬🇧 ${typeInfo.descriptionEn}\n\n` +
            `Staff ti risponderà qui il prima possibile.\n` +
            `When you're done, close the ticket with the button below.`
        )
        .setColor("Blue");

    await channel.send({
        content: `🎫 **Nuovo ticket aperto da <@${user.id}>**`,
        embeds: [embed],
        components: [closeRow]
    });

    return channel;
}

async function moveTicketToArchive(channel) {
    const guild = channel.guild;
    const botPermissions = getPermissions();
    
    let archiveCategory = null;

    if (config.TICKET_ARCHIVE_CATEGORY_ID) {
        archiveCategory = await guild.channels.fetch(config.TICKET_ARCHIVE_CATEGORY_ID).catch(() => null);
    }

    if (!archiveCategory || archiveCategory.type !== ChannelType.GuildCategory) {
        archiveCategory = await guild.channels.create({
            name: "📁│ticket-archivio",
            type: ChannelType.GuildCategory
        });
    }

    await channel.setParent(archiveCategory.id, { lockPermissions: false });

    const overwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
        }
    ];

    for (const roleId of botPermissions.allowedRoles) {
        overwrites.push({
            id: roleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
        });
    }

    await channel.permissionOverwrites.set(overwrites);
}

// ------------------------------------------------------------
// HELPER PER AI CHANNEL
// ------------------------------------------------------------

function startAiSessionCleanupLoop(client) {
    console.log("⏱ Loop pulizia canali AI avviato.");
    setInterval(async () => {
        const aiSessions = getData(config.FILES.AI_SESSIONS);
        const now = Date.now();
        const deletedChannels = [];

        for (const [channelId, session] of Object.entries(aiSessions)) {
            try {
                if (now - session.lastActivity < config.AI_SESSION_TIMEOUT_MS) continue;

                const guild = await client.guilds.fetch(session.guildId).catch(() => null);
                if (!guild) {
                    deletedChannels.push(channelId);
                    continue;
                }

                let ch = guild.channels.cache.get(channelId);
                if (!ch) ch = await guild.channels.fetch(channelId).catch(() => null);
                if (!ch) {
                    deletedChannels.push(channelId);
                    continue;
                }

                await ch.send("⌛ Questo canale AI è stato inattivo troppo a lungo e verrà eliminato.").catch(() => {});
                await ch.delete().catch(() => {});
                deletedChannels.push(channelId);

            } catch (err) {
                console.error("⚠ Errore nella pulizia canale AI:", err);
            }
        }
        
        // Rimuove i canali eliminati dai dati
        let shouldSave = false;
        deletedChannels.forEach(id => {
            if (aiSessions[id]) {
                delete aiSessions[id];
                shouldSave = true;
            }
        });
        if (shouldSave) saveData(config.FILES.AI_SESSIONS, aiSessions);
        
    }, 5 * 60 * 1000); // Controlla ogni 5 minuti
}


async function createAiChannel(guild, user) {
    if (!AI_STATUS.available) {
        return null; 
    }
    
    const aiSessions = getData(config.FILES.AI_SESSIONS);
    
    // Controlla se l'utente ha già un canale AI aperto
    const existingSession = Object.entries(aiSessions).find(([, session]) => session.userId === user.id);
    if (existingSession) {
        const [existingChannelId] = existingSession;
        return guild.channels.cache.get(existingChannelId);
    }
    
    const aiCategory = await getOrCreateCategory(guild, config.AI_CATEGORY_NAME);
    const baseName = `ai-${user.username}`.toLowerCase().replace(/[^a-z0-9\-]/g, "");
    const uniqueId = user.id.slice(-4);
    const channelName = `${baseName}-${uniqueId}`;

    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: aiCategory.id,
        topic: `AI_SESSION | USERID: ${user.id}`,
        permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
        ]
    });

    aiSessions[channel.id] = {
        guildId: guild.id,
        userId: user.id,
        lastActivity: Date.now()
    };
    saveData(config.FILES.AI_SESSIONS, aiSessions);

    const introEmbed = new EmbedBuilder()
        // AGGIORNATO A SENTINEL
        .setTitle("🤖 Canale personale con l'AI – Sentinel Assistant")
        .setDescription(
            `🇮🇹 Qui puoi fare domande sull'esperienza di gioco su **${getData(config.FILES.SERVER_CONFIG).name}**.\n\n` +
            `⏱ Questo canale verrà eliminato dopo **${config.AI_SESSION_TIMEOUT_MINUTES} minuti di inattività**.\n\n` +
            `🇬🇧 Here you can ask questions about **${getData(config.FILES.SERVER_CONFIG).name}**.\n` +
            `Channel will be auto-deleted after **${config.AI_SESSION_TIMEOUT_MINUTES} minutes of inactivity**.`
        )
        .setColor("DarkPurple");

    await channel.send({ embeds: [introEmbed] });

    return channel;
}


// ------------------------------------------------------------
// HELPER PER SERVER INFO
// ------------------------------------------------------------

function getServerInfoEmbed() {
    const serverConfig = getData(config.FILES.SERVER_CONFIG);
    
    return new EmbedBuilder()
        .setTitle(`⚔️ Dettagli Server DayZ – ${serverConfig.name}`)
        .setDescription("Ecco le informazioni principali per connetterti e giocare nel nostro server Full PvP!")
        .setColor("#FF4500")
        .addFields(
            { name: "IP & Porta", value: `\`${serverConfig.ip}:${serverConfig.port}\``, inline: true },
            { name: "Slot Max", value: `${serverConfig.slots}`, inline: true },
            { name: "Stile di Gioco", value: serverConfig.style, inline: true },
            { name: "Wipe Prossimo", value: serverConfig.wipe, inline: true },
            { name: "Restart Server", value: serverConfig.restart, inline: true },
            { name: "Mods Principali", value: serverConfig.mods, inline: false }
        )
        // AGGIORNATO A SENTINEL
        .setFooter({ text: "Aggiornato da DayZ Sentinel" });
}

async function ensureRulesMessage(client) {
    // Funzione per ricreare/aggiornare il messaggio regole se non esiste/non è corretto
    // (Implementazione omessa per brevità ma presente nel codice originale)
}


module.exports = {
    getRulesText,
    saveRulesMessageInfo,
    getOrCreateCategory,
    getOrCreateTextChannel,
    createTicketChannel,
    moveTicketToArchive,
    startAiSessionCleanupLoop,
    createAiChannel,
    getServerInfoEmbed,
    ensureRulesMessage,
    getPermissions
};
