// events/ready.js

const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        // Log solo per conferma. Loop e attività impostate in index.js.
        console.log(`✅ Bot loggato come ${client.user.tag}`);
        console.log(`✅ Bot ${client.user.tag} ONLINE!`);
    },
};
