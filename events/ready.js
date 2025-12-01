// events/ready.js

const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        // La registrazione dei comandi slash avviene in index.js prima di questo evento.
        // I loop XP e AI vengono avviati in index.js subito dopo il login.
        
        // Questo file ora si occupa solo di log e attività, 
        // evitando chiamate duplicate che causano crash.
        console.log(`✅ Bot loggato come ${client.user.tag}`);
        console.log(`✅ Bot ${client.user.tag} ONLINE!`);
    },
};
