// index.js

require("dotenv").config();
const { Client, GatewayIntentBits, Partials, ActivityType } = require("discord.js");
const path = require("path");
const os = require("os");
const config = require("./config");
const { loadAllData } = require("./utils/db");
const commandHandler = require("./handlers/commandHandler");
const eventHandler = require("./handlers/eventHandler");

// ------------------------------------------------------------
// CLIENT DISCORD
// ------------------------------------------------------------

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ------------------------------------------------------------
// INIZIALIZZAZIONE
// ------------------------------------------------------------

async function startBot() {
    console.log(`\n--- V 1.7 beta - 69x Pacific AI Unit - Node ${process.version} ---`);
    console.log(`Hostname: ${os.hostname()}`);
    
    // 1. Carica i dati (configurazioni/livelli, ecc.)
    await loadAllData();
    
    // 2. Carica i comandi e gli eventi
    commandHandler.loadCommands(path.join(__dirname, "commands"));
    eventHandler.loadEvents(client, path.join(__dirname, "events"));

    // 3. Login
    await client.login(config.BOT_TOKEN);
}

// ------------------------------------------------------------
// HELPER: rileva se sta giocando a DayZ (necessario per XP loop)
// ------------------------------------------------------------

client.isPlayingDayZ = (member) => {
    const presence = member?.presence;
    if (!presence || !presence.activities || presence.activities.length === 0) {
        return false;
    }
    return presence.activities.some(a =>
        a.type === ActivityType.Playing &&
        a.name &&
        a.name.toLowerCase().includes("dayz")
    );
}

startBot();
