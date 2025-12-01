// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType, Events, ChannelType } = require('discord.js');
const path = require('path'); // Importazione essenziale per i percorsi

// Importazione moduli locali
const { xpTickLoop } = require('./utils/xpUtils');
const { getInitialData, getData, saveData } = require('./utils/db');
const commandHandler = require('./handlers/commandHandler'); // Importa l'intero modulo
const eventHandler = require('./handlers/eventHandler');     // Importa l'intero modulo
const config = require('./config');
const { AI_STATUS, askGemini, getAiUnavailableMessage } = require('./utils/gemini');

// --------------------------------------------------------
// INIZIALIZZAZIONE DATI
// --------------------------------------------------------
// Assicura che i file JSON esistano prima di fare qualsiasi altra cosa
getInitialData();

// --------------------------------------------------------
// CONFIGURAZIONE CLIENT DISCORD
// --------------------------------------------------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,   // Richiesto per gestione ruoli e membri
        GatewayIntentBits.GuildPresences, // Richiesto per tracciare lo stato di gioco (DayZ)
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Richiesto per leggere i messaggi nella chat AI
    ],
});

// --------------------------------------------------------
// FUNZIONI UTILI GLOBAL (Correzione Crash toLowerCase)
// --------------------------------------------------------

// Aggiungi la funzione al client per l'uso in xpUtils (xpTickLoop)
client.isPlayingDayZ = (member) => {
    // Se l'utente è offline o non ha attività, ritorna false
    if (!member.presence || !member.presence.activities) return false;
    
    // Recupera il nome del gioco dal config, con fallback a 'DayZ'
    const targetGame = config.XP_GAINS?.GAME_NAME_TO_TRACK || 'DayZ';

    // Cerca tra le attività dell'utente
    return member.presence.activities.some(activity => 
        activity.type === ActivityType.Playing && 
        activity.name && // <--- FIX IMPORTANTE: Controlla che il nome esista!
        activity.name.toLowerCase() === targetGame.toLowerCase()
    );
};

// --------------------------------------------------------
// GESTIONE EVENTI E COMANDI (Handler)
// --------------------------------------------------------

// 1. Carica i comandi dalla cartella
const commandsPath = path.join(__dirname, 'commands');
commandHandler.loadCommands(commandsPath);

// 2. Carica gli eventi (ready, interactionCreate, ecc.)
eventHandler.loadEvents(client);

// 3. Registra i comandi su Discord (API)
commandHandler.updateAllCommands(client);

// --------------------------------------------------------
// GESTIONE CHAT AI (Listener MessageCreate)
// --------------------------------------------------------

client.on(Events.MessageCreate, async message => {
    // Ignora bot e messaggi fuori dai server
    if (message.author.bot || message.channel.type !== ChannelType.GuildText) return;
    
    const aiSessions = getData(config.FILES.AI_SESSIONS);
    
    // Controlla se il messaggio proviene da un canale AI attivo e dall'utente corretto
    if (aiSessions && aiSessions[message.channelId] && message.author.id === aiSessions[message.channelId].userId) {
        
        // AGGIORNA ATTIVITÀ AI per prevenire la cancellazione del canale
        aiSessions[message.channelId].lastActivity = Date.now();
        saveData(config.FILES.AI_SESSIONS, aiSessions);
        
        // Verifica disponibilità API
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
            await message.reply("⚠ Errore comunicando con l'AI. Riprova tra qualche minuto.");
        }
    }
});

// --------------------------------------------------------
// LOGIN E AVVIO
// --------------------------------------------------------

client.once(Events.ClientReady, c => {
    console.log(`✅ Bot loggato come ${c.user.tag}`);
    console.log(`✅ Bot ${c.user.tag} ONLINE!`);
    
    // Avvia il loop XP solo dopo che il bot è pronto
    xpTickLoop(client); 
    
    // Imposta lo stato "Watching DayZ"
    c.user.setActivity(config.XP_GAINS?.GAME_NAME_TO_TRACK || 'DayZ', { type: ActivityType.Watching });
});

// Login finale
client.login(process.env.DISCORD_TOKEN);
