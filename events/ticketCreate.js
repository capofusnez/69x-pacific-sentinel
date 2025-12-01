// events/ticketCreate.js
const { 
    ChannelType, 
    PermissionsBitField, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const config = require('../config');

// Funzione principale per creare il ticket
async function createTicketChannel(interaction) {
    // Il customId è nel formato 'ticket_create_KEY', quindi estraiamo la KEY
    const typeKey = interaction.customId.split('_').pop(); 
    const typeInfo = config.TICKET_TYPES[typeKey];
    
    // Verifica base
    if (!typeInfo) {
        return interaction.reply({ 
            content: "Errore: Tipo di ticket non configurato.", 
            ephemeral: true 
        });
    }

    // Controlla se l'utente ha già un ticket aperto (opzionale ma consigliato)
    const existingTicket = interaction.guild.channels.cache.find(
        c => c.name.startsWith(`ticket-${interaction.user.username.toLowerCase()}`)
    );
    if (existingTicket) {
        return interaction.reply({
            content: `Hai già un ticket aperto: ${existingTicket}`,
            ephemeral: true,
        });
    }

    // --- 1. Definizione dei Permessi ---
    const staffRoleIds = [...config.ADMIN_ROLES, ...config.MODERATOR_ROLES];
    const staffPermissions = staffRoleIds.map(id => ({
        id: id,
        allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
        ],
    }));

    // Permessi base per il canale
    const permissionOverwrites = [
        // Permessi per il BOT (importante)
        {
            id: interaction.client.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels]
        },
        // Permessi per l'utente che ha aperto il ticket
        {
            id: interaction.user.id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory
            ],
        },
        // Permessi per tutti (devono negare l'accesso)
        {
            id: interaction.guild.roles.everyone,
            deny: [PermissionsBitField.Flags.ViewChannel],
        },
        ...staffPermissions // Permessi per gli Staff/Admin
    ];
    
    // --- 2. Creazione del Canale ---
    try {
        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${typeKey}-${interaction.user.username.substring(0, 10).toLowerCase()}`,
            type: ChannelType.GuildText,
            parent: config.TICKET_CATEGORY_ID, // ID della categoria dal config
            permissionOverwrites: permissionOverwrites,
            topic: `Ticket aperto da ${interaction.user.tag} (${interaction.user.id}) per ${typeInfo.label}.`
        });

        // Conferma all'utente e rimuovi l'interazione iniziale
        await interaction.reply({ 
            content: `✅ Il tuo ticket (${typeInfo.label}) è stato creato in ${ticketChannel}`, 
            ephemeral: true 
        });
        
        // --- 3. Messaggio di Benvenuto nel Canale ---
        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`🎫 Ticket Aperto: ${typeInfo.label}`)
            .setDescription(
                `Benvenuto/Welcome, ${interaction.user}!\n` +
                `Spiega qui il tuo problema o la tua segnalazione in dettaglio (italiano o inglese). Lo staff ti risponderà al più presto.\n\n` +
                `**Tipo:** ${typeInfo.label}`
            )
            .setColor(typeInfo.emoji === '🚨' ? '#FF0000' : '#3498db');

        const closeButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_close')
                .setLabel('Chiudi Ticket / Close Ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒')
        );

        await ticketChannel.send({ 
            embeds: [welcomeEmbed], 
            components: [closeButton] 
        });

    } catch (error) {
        console.error("❌ Errore nella creazione del ticket:", error);
        await interaction.reply({ 
            content: "Si è verificato un errore durante la creazione del ticket. Controlla che il BOT abbia i permessi di `Manage Channels` e che `TICKET_CATEGORY_ID` sia corretto.", 
            ephemeral: true 
        });
    }
}

module.exports = {
    createTicketChannel
};
