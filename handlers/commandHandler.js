const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config'); // Assicurati di importare il file config

// Inizializza una Map per memorizzare i comandi
const commands = new Map();

/**
 * Carica i file dei comandi da una directory.
 * @param {string} commandsPath - Il percorso della directory dei comandi.
 */
function loadCommands(commandsPath) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                commands.set(command.data.name, command);
            } else {
                console.warn(`[ATTENZIONE] Il comando in ${filePath} è privo di "data" o "execute" richiesti.`);
            }
        } catch (error) {
            console.error(`[ERRORE] Impossibile caricare il comando in ${filePath}: ${error.message}`);
        }
    }
    console.log(`✅ Caricati ${commands.size} comandi slash.`);
    return commands;
}

/**
 * Registra o aggiorna tutti i comandi slash sul server.
 * @param {Client} client - L'istanza del client Discord.
 */
async function updateAllCommands(client) {
    // ------------------------------------------------------------------
    // CORREZIONE SERVER_ID: Legge l'ID del Server da .env
    // ------------------------------------------------------------------
    const GUILD_ID = process.env.SERVER_ID; 
    const CLIENT_ID = process.env.CLIENT_ID; // Legge il Client ID da .env

    if (!CLIENT_ID) {
        console.error("❌ ERRORE: CLIENT_ID non trovato nel file .env.");
        return;
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commandsData = Array.from(commands.values()).map(command => command.data.toJSON());

    console.log(`🌀 Avvio l'aggiornamento di ${commandsData.length} comandi slash...`);

    // Determina l'endpoint: Guild-specifico (più veloce) o Globale
    let endpoint;
    if (GUILD_ID) {
        endpoint = Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID);
        console.log(`(Modalità: Registrazione su Guild per ID: ${GUILD_ID})`);
    } else {
        endpoint = Routes.applicationCommands(CLIENT_ID);
        console.warn("(Modalità: SERVER_ID non trovato. Registrazione Globale (può richiedere fino a 1 ora).)");
    }
    
    try {
        const data = await rest.put(endpoint, { body: commandsData });

        if (GUILD_ID) {
            console.log(`✅ Registrati ${data.length} comandi slash sul server.`);
        } else {
             console.log(`✅ Registrati ${data.length} comandi slash a livello globale.`);
        }
    } catch (error) {
        console.error("❌ ERRORE durante l'aggiornamento dei comandi slash:", error);
    }
}

module.exports = {
    loadCommands,
    updateAllCommands,
    commands // Esporta i comandi per essere usati nell'event handler
};
