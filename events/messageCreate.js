// events/messageCreate.js

const { Events } = require('discord.js');
const { updateMemberXp } = require('../utils/xpUtils');
const config = require('../config');

// Frequenza minima in millisecondi tra un guadagno XP da messaggio e l'altro
const COOLDOWN_MS = 60000; // 60 secondi (Evita spamming)
const userCooldowns = new Map();

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message) {
        // Ignora i bot, i messaggi nei DM e i messaggi che non hanno un contenuto utile (solo allegati)
        if (message.author.bot || !message.guild || !message.content) return;

        const userId = message.author.id;
        const now = Date.now();

        // 1. Controlla il cooldown (per evitare spamming XP)
        if (userCooldowns.has(userId) && now < userCooldowns.get(userId)) {
            return; 
        }

        // 2. Se è in un canale AI Thread, ignora per evitare doppio conteggio o interferenze
        const aiSessions = require('../utils/db').getData(config.FILES.AI_SESSIONS);
        if (aiSessions[message.channelId]) {
            return;
        }

        // 3. Imposta il cooldown per l'utente
        userCooldowns.set(userId, now + COOLDOWN_MS);
        
        // 4. Aggiorna l'XP
        const xpAmount = config.XP_GAINS.MESSAGE_SEND || 1; // Prendi l'XP dal config
        
        // La funzione updateMemberXp gestirà il salvataggio dei dati e l'aggiornamento del grado
        updateMemberXp(message.member, xpAmount, message.client);
    },
};
