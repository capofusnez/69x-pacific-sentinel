// handlers/commandHandler.js

const fs = require("fs");
const { Collection, REST, Routes } = require("discord.js"); // Aggiunto REST e Routes
const path = require("path");
const config = require('../config'); // Necessario per ID e Token

// Collection per i comandi
const commands = new Collection();
const commandsToRegister = []; // Per l'API Discord

function loadCommands(commandsPath) {
    try {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            if ("data" in command && "execute" in command) {
                commands.set(command.data.name, command);
                commandsToRegister.push(command.data);
            } else {
                console.log(`[WARNING] Il comando in ${file} manca di "data" o "execute" richiesti.`);
            }
        }
        console.log(`✅ Caricati ${commands.size} comandi slash.`);
    } catch (err) {
        console.error("⚠ Errore nel caricamento dei comandi:", err);
    }
}

function getCommands() {
    return commands;
}

function getCommandsToRegister() {
    return commandsToRegister;
}

/**
 * Registra o aggiorna tutti i comandi slash sul server o globalmente.
 * @param {Client} client L'istanza del client Discord.
 */
async function updateAllCommands(client) {
    const commands = getCommandsToRegister();
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    try {
        console.log(`🌀 Avvio l'aggiornamento di ${commands.length} comandi slash...`);

        // Aggiorna i comandi sul server specifico (più veloce per i test)
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, config.SERVER_ID),
            { body: commands },
        );

        console.log(`✅ Registrati ${data.length} comandi slash sul server.`);
    } catch (error) {
        console.error("❌ ERRORE durante l'aggiornamento dei comandi slash:", error);
    }
}

module.exports = {
    loadCommands,
    getCommands,
    getCommandsToRegister,
    updateAllCommands, // <--- FUNZIONE AGGIUNTA
};
