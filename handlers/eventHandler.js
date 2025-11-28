// handlers/eventHandler.js

const fs = require("fs");
const path = require("path");

function loadEvents(client, eventsPath) {
    try {
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

        for (const file of eventFiles) {
            const event = require(path.join(eventsPath, file));
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
        }
        console.log(`✅ Caricati ${eventFiles.length} eventi.`);
    } catch (err) {
        console.error("⚠ Errore nel caricamento degli eventi:", err);
    }
}

module.exports = {
    loadEvents
};
