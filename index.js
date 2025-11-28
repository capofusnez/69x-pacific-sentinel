// index.js

require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType, Events, ChannelType } = require('discord.js');
const path = require('path');
const { xpTickLoop } = require('./utils/xpUtils');
const { getInitialData, getData, saveData } = require('./utils/db'); 
const { updateAllCommands } = require('./handlers/commandHandler');
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');
const config = require('./config');
const { AI_STATUS, askGemini, getAiUnavailableMessage } = require('./utils/gemini');
const db = require('./utils/db');

// Inizializzazione Dati (per evitare crash)
db.getInitialData();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Richiesto per gestione ruoli e membri
        GatewayIntentBits.GuildPresences, // Richiesto per tracciare lo stato di gioco (DayZ)
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Richiesto per leggere i messaggi nella chat AI
    ],
});

// Aggiungi la funzione al client per l'uso in xpUtils (xpTickLoop)
client.isPlayingDayZ = (member) => {
    if (!member.presence || !member.presence.activities) return false;
    return member.presence.activities.some(
        activity => activity.type === ActivityType.Playing && activity.name.toLowerCase() === config.DAYZ_GAME_NAME.toLowerCase()
    );
};

// --------------------------------------------------------
// GESTIONE EVENTI E COMANDI (Handler)
// --------------------------------------------------------
const commandsPath = path.join(__dirname, 'commands');
commandHandler.loadCommands(commandsPath);
eventHandler.loadEvents(client);
updateAllCommands(client);

// --------------------------------------------------------
// GESTIONE CHAT AI (Listener MessageCreate)
// *Spostato qui per risolvere ReferenceError*
// --------------------------------------------------------

client.on(Events.MessageCreate, async message => {
    if (message.author.bot || message.channel.type !== ChannelType.GuildText) return;
    
    const aiSessions = getData(config.FILES.AI_SESSIONS);
    
    // Controlla se il messaggio proviene da un canale AI attivo e dall'utente corretto
    if (aiSessions[message.channelId] && message.author.id === aiSessions[message.channelId].userId) {
        
        // AGGIORNA ATTIVITÀ AI per prevenire la cancellazione del canale
        aiSessions[message.channelId].lastActivity = Date.now();
        saveData(config.FILES.AI_SESSIONS, aiSessions);
        
        if (!AI_STATUS.available) {
             return message.reply(getAiUnavailableMessage());
        }

        // INVIA A GEMINI
        await message.channel.sendTyping();
        try {
            const answer = await askGemini(message.content);
            await message.reply(answer);
        } catch (err) {
            console.error("Errore Gemini in sessione AI:", err);
            // Invia una risposta utile anche in caso di errore
            await message.reply("⚠ Errore comunicando con l'AI. Riprova tra qualche minuto.");
        }
    }
});


// --------------------------------------------------------
// LOGIN E AVVIO
// --------------------------------------------------------

client.once(Events.ClientReady, c => {
    console.log(`✅ Bot ${c.user.tag} ONLINE!`);
    
    // Avvia il loop XP solo dopo che il bot è pronto
    xpTickLoop(client); 
    
    // Imposta lo stato "Watching DayZ"
    c.user.setActivity(config.DAYZ_GAME_NAME, { type: ActivityType.Watching });
});


client.login(process.env.DISCORD_TOKEN);
