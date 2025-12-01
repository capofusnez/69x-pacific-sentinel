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

    // --- 1. Definizione dei Permessi (RISOLUZIONE ERRORE InvalidType) ---
    
    // Raccoglie tutti gli ID di staff in un'unica lista
    const allStaffIds = [...config.ADMIN_ROLES, ...config.MODERATOR_ROLES];
    
    // ⭐ FILTRO CRUCIALE: Accetta solo ID validi che sono ruoli esistenti nella cache della gilda ⭐
    const validStaffRoleIds = allStaffIds.filter(id => {
        // 1. Deve essere una stringa
        if (typeof id !== 'string') return false; 
        // 2. Deve essere composto solo da numeri (ID valido)
        if (!id.match(/^\d+$/)) return false; 
        // 3. Il ruolo deve esistere nella cache della Gilda
        return interaction.guild.roles.cache.has(id);
    });
    
    console.log(`[DEBUG TICKET] Ruoli Staff validi trovati: ${validStaffRoleIds.length}`);

    // Mappa gli ID validi in oggetti PermissionOverwrites
    const staffPermissions = validStaffRoleIds.map(id => ({
        id: id,
        allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
        ],
    }));

    // Permessi base per il canale
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
        // Permessi per tutti (devono negare l'accesso)
        {
            // ⭐ USARE interaction.guild.roles.everyone È IL METODO PIÙ AFFIDABILE ⭐
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

        // Conferma all'utente
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
            content: "Si è verificato un errore durante la creazione del ticket. Controlla che il BOT abbia i permessi di `Manage Channels` e che tutti gli ID in config.js siano corretti.", 
            ephemeral: true 
        });
    }
}

module.exports = {
    createTicketChannel
};
