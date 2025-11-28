// handlers/eventHandler.js

const fs = require('fs');
const path = require('path'); // <--- DEVE ESSERE QUI
const { Events } = require('discord.js');

module.exports = {
    loadEvents(client) {
        try {
            // RIGA 8: Definisci il percorso assoluto alla cartella 'events'
            // __dirname è la cartella 'handlers', '..' la riporta alla radice del progetto.
            const eventsPath = path.join(__dirname, '..', 'events'); 
            
            // VERIFICA CHE LA TUA RIGA 8 SIA ESATTAMENTE COSÌ:
            const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js')); 

            for (const file of eventFiles) {
                const filePath = path.join(eventsPath, file);
                const event = require(filePath);
                
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                }
            }
        } catch (error) {
            // L'errore viene catturato qui e stampato:
            console.log('⚠ Errore nel caricamento degli eventi:', error.message);
        }
    }
};
