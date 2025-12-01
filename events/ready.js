// events/ready.js

const { Events } = require('discord.js');
const commandHandler = require('../handlers/commandHandler'); 
const { startCleanUpLoop } = require('../utils/gemini');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ Bot loggato come ${client.user.tag}`);
        console.log(`✅ Bot ${client.user.tag} ONLINE!`);
        
        // --- LOGICA DI PULIZIA TICKET E ALTRI LOOP ---
        
        // Avvia il loop di pulizia dei canali AI
        startCleanUpLoop(client);
        
        // NOTA: La registrazione dei comandi slash è stata spostata in index.js.
        // NON CHIAMARE AGGIORNAMENTI DEI COMANDI QUI PER EVITARE CONFLITTI.
    },
};
