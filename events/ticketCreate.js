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

// ID della categoria di archivio specificata dall'utente
const ARCHIVE_CATEGORY_ID = "1443351281145086144"; 

// ====================================================================
// FUNZIONE PER LA CREAZIONE DEL TICKET
// ====================================================================

async function createTicketChannel(interaction) {
    const typeKey = interaction.customId.split('_').pop(); 
    const typeInfo = config.TICKET_TYPES[typeKey];
    
    if (!typeInfo) {
        return interaction.reply({ 
            content: "Errore: Tipo di ticket non configurato.", 
            ephemeral: true 
        });
    }

    // Controlla se l'utente ha già un ticket aperto
    const existingTicket = interaction.guild.channels.cache.find(
        c => c.name.startsWith(`ticket-${interaction.user.username.toLowerCase()}`) && c.parentId === config.TICKET_CATEGORY_ID
    );
    if (existingTicket) {
        return interaction.reply({
            content: `Hai già un ticket aperto: ${existingTicket}`,
            ephemeral: true,
        });
    }

    // --- 1. Definizione dei Permessi (Filtro Ruoli Staff Robusti) ---
    const allStaffIds = [...config.ADMIN_ROLES, ...config.MODERATOR_ROLES];
    
    const validStaffRoleIds = allStaffIds.filter(id => {
        if (typeof id !== 'string' || !id.match(/^\d+$/)) return false; 
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
            topic: `Ticket aperto da ${interaction.user.tag} (${interaction.user.id}) per ${typeInfo.label}.` // Topic cruciale per la chiusura
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

// ====================================================================
// FUNZIONE PER L'ARCHIVIAZIONE (CHIUSURA) DEL TICKET
// ====================================================================

async function closeTicket(interaction) {
    const channel = interaction.channel;
    
    // Controllo base
    if (!channel.name.startsWith('ticket-')) {
        return interaction.reply({ 
            content: "Questo pulsante non è valido qui, non è un canale ticket attivo.", 
            ephemeral: true 
        });
    }
    
    await interaction.deferReply(); 

    try {
        // --- 1. Trova l'utente che ha aperto il ticket dal Topic ---
        const userIdMatch = channel.topic ? channel.topic.match(/\((\d+)\)/) : null;
        const userId = userIdMatch ? userIdMatch[1] : null;

        // --- 2. Rinominazione e Spostamento ---
        const newName = channel.name.replace('ticket-', 'closed-');
        
        await channel.edit({
            name: newName,
            parent: ARCHIVE_CATEGORY_ID, // ⭐ Sposta nella categoria di archivio
            lockPermissions: false, // Necessario per modificare i permessi
        });

        // --- 3. Rimozione Permessi Utente ---
        let removeAccessMessage = "";

        if (userId) {
            await channel.permissionOverwrites.edit(userId, {
                ViewChannel: false, // L'utente non può più vedere il canale
                SendMessages: false,
            });
            removeAccessMessage = `Accesso rimosso per l'utente <@${userId}>. | Access removed for the user.`;
        } else {
             removeAccessMessage = `⚠️ **ATTENZIONE:** Non è stato possibile identificare l'utente che ha aperto il ticket. Lo staff deve verificare manualmente i permessi.`;
        }

        // --- 4. Messaggio Finale e Conferma ---
        await channel.send(
            `\n=================================\n` +
            `🔒 **TICKET ARCHIVIATO** da ${interaction.user}.\n` +
            `**Motivazione:** Discussione conclusa o risolta.\n` +
            `${removeAccessMessage}\n` +
            `=================================`
        );
        
        await interaction.editReply({
            content: `✅ **Ticket Archiviato!** Il canale è stato spostato e archiviato in <#${ARCHIVE_CATEGORY_ID}>.`,
            components: [], // Rimuove il pulsante "Chiudi Ticket"
        });


    } catch (error) {
        console.error("❌ Errore nell'archiviazione del ticket:", error);
        await interaction.editReply({
            content: "Si è verificato un errore durante l'archiviazione del ticket. Assicurati che il BOT abbia i permessi di `Manage Channels` sia nella categoria di origine che in quella di archivio (`" + ARCHIVE_CATEGORY_ID + "`).",
        });
    }
}

// ====================================================================
// ESPORTAZIONE
// ====================================================================

module.exports = {
    createTicketChannel,
    closeTicket
};
