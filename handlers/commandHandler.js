const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config'); 

const commands = new Map();

/**
 * Carica i file dei comandi da una directory e li memorizza nella mappa.
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
 * Risolve l'errore Invalid Form Body (guild_id).
 * @param {Client} client - L'istanza del client Discord.
 */
async function updateAllCommands(client) {
    
    const GUILD_ID = process.env.SERVER_ID; 
    const CLIENT_ID = process.env.CLIENT_ID; 
    
    if (!CLIENT_ID || !process.env.DISCORD_TOKEN) {
        console.error("❌ ERRORE: Assicurati che CLIENT_ID e DISCORD_TOKEN siano nel file .env.");
        return;
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commandsData = Array.from(commands.values()).map(command => command.data.toJSON());

    console.log(`🌀 Avvio l'aggiornamento di ${commandsData.length} comandi slash...`);

    // Determina l'endpoint: usa l'ID del server per una registrazione rapida
    let endpoint;
    if (GUILD_ID) {
        endpoint = Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID);
        console.log(`(Modalità: Registrazione su Guild per ID: ${GUILD_ID})`);
    } else {
        endpoint = Routes.applicationCommands(CLIENT_ID);
        console.warn("(Modalità: SERVER_ID non trovato. Registrazione Globale (più lenta).)");
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
    commands // Esporta la mappa dei comandi
};
