// handlers/commandHandler.js

const fs = require("fs");
const { Collection } = require("discord.js");
const path = require("path");

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

module.exports = {
    loadCommands,
    getCommands,
    getCommandsToRegister
};
