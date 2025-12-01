// commands/ai.js (Nuova versione che gestisce sia /ai-chat che la funzione di creazione)

const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');
const { AI_STATUS, getAiUnavailableMessage } = require('../utils/gemini');
const { getData, saveData } = require('../utils/db');

/**
 * Funzione centralizzata per creare un canale AI e registrarlo.
 */
async function createAiSession(interaction) {
    const userId = interaction.user.id;
    const aiSessions = getData(config.FILES.AI_SESSIONS);
    const guild = interaction.guild;

    // 1. Verifica disponibilità AI
    if (!AI_STATUS.available) {
        return interaction.editReply({ content: getAiUnavailableMessage(), ephemeral: true });
    }

    // 2. Controlla se l'utente ha già una sessione attiva
    const existingChannelId = Object.keys(aiSessions).find(channelId => aiSessions[channelId].userId === userId);
    
    if (existingChannelId) {
        const existingChannel = guild.channels.cache.get(existingChannelId);
        if (existingChannel) {
            return interaction.editReply({ 
                content: `Hai già una sessione AI attiva in ${existingChannel}. Terminala per iniziarne una nuova.`, 
                ephemeral: true 
            });
        } else {
            delete aiSessions[existingChannelId];
            saveData(config.FILES.AI_SESSIONS, aiSessions);
        }
    }

    // 3. Trova la categoria per i canali AI
    const aiCategory = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name.includes(config.AI_CATEGORY_NAME)
    );

    if (!aiCategory) {
        console.error(`Categoria AI non trovata: ${config.AI_CATEGORY_NAME}`);
        return interaction.editReply({ 
            content: `Errore: La categoria dei canali AI ("${config.AI_CATEGORY_NAME}") non esiste. Contatta lo staff.`,
            ephemeral: true
        });
    }

    // 4. Crea il nuovo canale testuale
    const channelName = `🤖-ai-${interaction.user.username.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
    
    const newChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: aiCategory.id,
        permissionOverwrites: [
            {
                id: guild.id, // @everyone
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: userId, // L'utente che ha avviato il comando
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
            {
                id: interaction.client.user.id, // Il bot
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
            // QUI POTRESTI AGGIUNGERE UN RUOLO STAFF SE NECESSARIO
        ],
    });

    // 5. Registra la nuova sessione nel DB
    aiSessions[newChannel.id] = {
        userId: userId,
        lastActivity: Date.now(),
    };
    saveData(config.FILES.AI_SESSIONS, aiSessions);

    // 6. Messaggio di benvenuto
    const welcomeEmbed = new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle('🧠 Sessione AI Avviata')
        .setDescription(`Ciao ${interaction.user}! Inizia a fare le tue domande qui sotto. La sessione terminerà automaticamente dopo ${config.AI_SESSION_TIMEOUT_MINUTES} minuti di inattività.`);

    await newChannel.send({ embeds: [welcomeEmbed] });
    
    return interaction.editReply({ 
        content: `La tua sessione AI è pronta in ${newChannel}.`, 
        ephemeral: true 
    });
}

// Esporta la funzione riutilizzabile
module.exports = {
    data: new SlashCommandBuilder()
        .setName('ai-chat') // Se vuoi mantenere anche il comando slash
        .setDescription('🤖 Avvia una nuova sessione di chat con Gemini AI.'),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        await createAiSession(interaction);
    },
    
    createAiSession, // Esporta la funzione per l'uso nel file events/interactionCreate.js
};
