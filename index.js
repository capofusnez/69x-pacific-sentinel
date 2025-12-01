// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType, Events, ChannelType } = require('discord.js');
const path = require('path'); 

// Importazione moduli locali
const { xpTickLoop } = require('./utils/xpUtils'); // Importazione per il loop XP
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
        GatewayIntentBits.GuildPresences, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, 
    ],
});

// --------------------------------------------------------
// FUNZIONI UTILI GLOBAL (sendLongMessage e isPlayingDayZ)
// --------------------------------------------------------

/**
 * Helper per dividere i messaggi lunghi (> 2000 caratteri)
 */
async function sendLongMessage(channel, content, replyTo) {
    const MAX_LENGTH = 2000; 
    
    if (content.length <= MAX_LENGTH) {
        if (replyTo) {
            return await replyTo.reply(content);
        }
        return await channel.send(content);
    }
    
    const chunks = [];
    let currentChunk = '';

    for (const line of content.split('\n')) {
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

    for (const [index, chunk] of chunks.entries()) {
        if (index === 0 && replyTo) {
            await replyTo.reply(chunk);
        } else {
            await channel.send(chunk);
        }
    }
}


/**
 * Verifica se un membro sta giocando al gioco tracciato.
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

const commandsPath = path.join(__dirname, 'commands');
client.commands = commandHandler.loadCommands(commandsPath); 

eventHandler.loadEvents(client);

// Chiama l'aggiornamento comandi qui (viene eseguito una sola volta all'avvio)
commandHandler.updateAllCommands(client); 

// --------------------------------------------------------
// GESTIONE CHAT AI (Listener MessageCreate)
// --------------------------------------------------------

client.on(Events.MessageCreate, async message => {
    
    if (message.author.bot || message.channel.type !== ChannelType.GuildText) return;
    
    const aiSessions = getData(config.FILES.AI_SESSIONS);
    
    if (aiSessions && aiSessions[message.channelId] && message.author.id === aiSessions[message.channelId].userId) {
        
        aiSessions[message.channelId].lastActivity = Date.now();
        saveData(config.FILES.AI_SESSIONS, aiSessions);
        
        if (!AI_STATUS.available) {
             return message.reply(getAiUnavailableMessage());
        }

        await message.channel.sendTyping();
        try {
            const answer = await askGemini(message.content);
            
            await sendLongMessage(message.channel, answer, message); 
            
        } catch (err) {
            console.error("⚠ Errore Gemini in sessione AI:", err);
            await message.channel.send("⚠ Errore comunicando con l'AI. Riprova tra qualche minuto.");
        }
    }
});

// --------------------------------------------------------
// LOGIN E AVVIO
// --------------------------------------------------------

client.once(Events.ClientReady, c => {
    // Inizializza il loop XP subito dopo il login
    xpTickLoop(client); 
    
    c.user.setActivity(config.XP_GAINS?.GAME_NAME_TO_TRACK || 'DayZ', { type: ActivityType.Watching });
});

client.login(process.env.DISCORD_TOKEN);
