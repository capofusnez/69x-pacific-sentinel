// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType, Events, ChannelType } = require('discord.js');
const path = require('path'); 

// Importazione moduli locali
const { xpTickLoop } = require('./utils/xpUtils');
const { getInitialData, getData, saveData } = require('./utils/db');
const commandHandler = require('./handlers/commandHandler'); 
const eventHandler = require('./handlers/eventHandler');     
const config = require('./config');
const { AI_STATUS, askGemini, getAiUnavailableMessage } = require('./utils/gemini');

// --------------------------------------------------------
// INIZIALIZZAZIONE DATI
// --------------------------------------------------------
getInitialData();

// --------------------------------------------------------
// CONFIGURAZIONE CLIENT DISCORD
// --------------------------------------------------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,   
        GatewayIntentBits.GuildPresences, // NECESSARIO per tracciare lo stato di gioco e l'attività
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, 
    ],
});

// --------------------------------------------------------
// FUNZIONI UTILI GLOBAL
// --------------------------------------------------------

/**
 * Helper per dividere i messaggi lunghi (> 4000 caratteri) (FIX 4000 limit)
 */
async function sendLongMessage(channel, content, replyTo) {
    const MAX_LENGTH = 4000;
    
    // Se il messaggio è corto, invia direttamente
    if (content.length <= MAX_LENGTH) {
        if (replyTo) {
            return await replyTo.reply(content);
        }
        return await channel.send(content);
    }
    
    // Se il messaggio è lungo, dividi in blocchi e invia
    const chunks = [];
    let currentChunk = '';

    for (const line of content.split('\n')) {
        // Controlla se l'aggiunta della riga e del ritorno a capo supera il limite
        if (currentChunk.length + line.length + 1 <= MAX_LENGTH) {
            currentChunk += line + '\n';
        } else {
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
            }
            currentChunk = line + '\n';
        }
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    // Invia tutti i blocchi
    for (const [index, chunk] of chunks.entries()) {
        if (index === 0 && replyTo) {
            // Risponde al messaggio originale solo con il primo chunk
            await replyTo.reply(chunk);
        } else {
            // Invia i successivi come messaggi normali
            await channel.send(chunk);
        }
    }
}


/**
 * Verifica se un membro sta giocando a DayZ (FIX per toLowerCase crash)
 */
client.isPlayingDayZ = (member) => {
    if (!member.presence || !member.presence.activities) return false;
    
    const targetGame = config.XP_GAINS?.GAME_NAME_TO_TRACK || 'DayZ';

    return member.presence.activities.some(activity => 
        activity.type === ActivityType.Playing && 
        activity.name && 
        activity.name.toLowerCase() === targetGame.toLowerCase()
    );
};

// --------------------------------------------------------
// GESTIONE EVENTI E COMANDI (Handler)
// --------------------------------------------------------

const commandsPath = path.join(__dirname, '
