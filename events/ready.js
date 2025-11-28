// events/ready.js

const { Events, REST, Routes } = require("discord.js");
const commandHandler = require("../handlers/commandHandler");
const config = require("../config");
const { startAiSessionCleanupLoop, ensureRulesMessage } = require("../utils/serverUtils");
const { xpTickLoop } = require("../utils/xpUtils");

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`\n✅ Bot loggato come ${client.user.tag}`);
        // AGGIORNATO A SENTINEL
        client.user.setActivity("DayZ Full PvP | Sentinel Active", { type: 0 }); 

        // 1. Registrazione Comandi Slash
        const rest = new REST({ version: "10" }).setToken(config.BOT_TOKEN);
        try {
            await rest.put(
                Routes.applicationGuildCommands(config.CLIENT_ID, config.SERVER_ID),
                { body: commandHandler.getCommandsToRegister() }
            );
            console.log("✅ Comandi slash registrati (o aggiornati).");
        } catch (err) {
            console.error("⚠ Errore registrando i comandi:", err);
        }

        // 2. Assicura messaggio regole
        // await ensureRulesMessage(client);
        
        // 3. Avvia i loop di manutenzione
        startAiSessionCleanupLoop(client);
        xpTickLoop(client);
    },
};
