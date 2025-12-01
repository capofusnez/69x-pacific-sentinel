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
    const typeKey = interaction.customId.split('_').pop(); 
    const typeInfo = config.TICKET_TYPES[typeKey];
    
    if (!typeInfo) {
        return interaction.reply({ 
            content: "Errore: Tipo di ticket non configurato.", 
            ephemeral: true 
        });
    }

    // Controlla se l'utente ha già un ticket aperto (facoltativo, ma impedisce spam di canali)
    const existingTicket = interaction.guild.channels.cache.find(
        c => c.name.startsWith(`ticket-${interaction.user.username.toLowerCase()}`) && c.parentId === config.TICKET_CATEGORY_ID
    );
    if (existingTicket) {
        return interaction.reply({
            content: `Hai già un ticket aperto: ${existingTicket}`,
            ephemeral: true,
        });
    }

    // --- 1. Definizione dei Permessi ---
    const allStaffIds = [...config.ADMIN_ROLES, ...config.MODERATOR_ROLES];
    
    // FILTRO: Accetta solo ID validi che sono ruoli esistenti nella cache della gilda
    const validStaffRoleIds = allStaffIds.filter(id => {
        if (typeof id !== 'string') return false; 
        if (!id.match(/^\d+$/)) return false; 
        return interaction.guild.roles.cache.has(id);
    });
    
    const staffPermissions = validStaffRoleIds.map(id => ({
        id: id,
        allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
        ],
    }));

    const permissionOverwrites = [
        // Permessi per il BOT
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
        // Permessi per tutti (negazione)
        {
            id: interaction.guild.roles.everyone,
            deny: [PermissionsBitField.Flags.ViewChannel],
        },
        ...staffPermissions // Permessi per gli Staff/Admin validi
    ];
    
    // --- 2. Creazione del Canale ---
    try {
        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${typeKey}-${interaction.user.username.substring(0, 10).toLowerCase()}`,
            type: ChannelType.GuildText,
            parent: config.TICKET_CATEGORY_ID, 
            permissionOverwrites: permissionOverwrites,
            topic: `Ticket aperto da ${interaction.user.tag} (${interaction.user.id}) per ${typeInfo.label}.`
        });

        await interaction.reply({ 
            content: `✅ Il tuo ticket (${typeInfo.label}) è stato creato in ${ticketChannel}`, 
            ephemeral: true 
        });
        
        // --- 3. Messaggio di Benvenuto ---
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


// FUNZIONE PER LA CHIUSURA DEL TICKET
async function closeTicket(interaction) {
    
    // Controlla se il canale è un ticket (controllo meno rigido per evitare errori)
    if (!interaction.channel.name.startsWith('ticket-')) {
        return interaction.reply({ 
            content: "Questo pulsante non è valido qui.", 
            ephemeral: true 
        });
    }
    
    await interaction.deferReply(); 

    try {
        // Rimuovi i componenti (i pulsanti) per prevenire ulteriori azioni
        await interaction.editReply({
            content: `🔒 **Ticket Chiuso!** Questo canale verrà eliminato tra 5 secondi. | **Ticket Closed!** This channel will be deleted in 5 seconds.`,
            embeds: [],
            components: []
        });

        // Elimina il canale dopo un breve ritardo
        setTimeout(async () => {
            await interaction.channel.delete('Ticket chiuso dall\'utente o dallo staff.');
        }, 5000); 

    } catch (error) {
        console.error("❌ Errore nella chiusura del ticket:", error);
        await interaction.editReply({
            content: "Si è verificato un errore durante la chiusura del ticket. Assicurati che il BOT abbia i permessi di `Manage Channels`.",
        });
    }
}

module.exports = {
    createTicketChannel,
    closeTicket // ESPORTIAMO LA FUNZIONE
};
