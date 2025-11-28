// commands/ticket-panel.js

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../config");
const { getPermissions } = require("../utils/serverUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-panel")
        .setDescription("📩 [ADMIN] Invia il pannello per aprire i ticket nel canale corrente.")
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        const { allowedRoles } = getPermissions();
        
        if (!interaction.member.permissions.has("Administrator") && !interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
            return interaction.reply({ content: "Non hai il permesso di usare questo comando.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        
        const ticketEmbed = new EmbedBuilder()
            .setTitle("📩 Apri un Ticket di Supporto")
            .setDescription(
                "🇮🇹 Seleziona il tipo di supporto di cui hai bisogno (Generale, Bug, Segnalazione, etc.).\n" +
                "🇬🇧 Select the type of support you need (General, Bug, Report, etc.).\n\n" +
                "Solo lo staff e tu potrete vedere il canale creato."
            )
            .setColor("#3498db");
        
        const row = new ActionRowBuilder();
        
        // Aggiungi un pulsante per ogni tipo di ticket
       // Aggiungi un pulsante per ogni tipo di ticket
        Object.keys(config.TICKET_TYPES).forEach(key => {
            const typeInfo = config.TICKET_TYPES[key];
    
            // Controlla se l'etichetta ha un'emoji (il primo elemento dopo lo split)
            const labelParts = typeInfo.label.split(' ');
            const emoji = labelParts.length > 1 && labelParts[0].length <= 2 ? labelParts[0] : null;
            const labelText = emoji ? labelParts.slice(1).join(' ') : typeInfo.label;
    
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket_create_${key}`)
                    .setLabel(labelText) // <-- ORA USA L'ETICHETTA COMPLETA (es. "Supporto Generale")
                    .setEmoji(emoji)     // <-- USA L'EMOJI SE DEFINITA
                    .setStyle(typeInfo.style || ButtonStyle.Secondary) // <-- Usa lo stile definito in config o Secondary
    );
});
        try {
            await interaction.channel.send({
                embeds: [ticketEmbed],
                components: [row]
            });
            
            await interaction.editReply({ content: "✅ Pannello Ticket inviato!", ephemeral: true });
            
        } catch (error) {
            console.error("Errore nell'invio del pannello ticket:", error);
            await interaction.editReply({ content: "⚠ Errore nell'invio del pannello ticket.", ephemeral: true });
        }
    },
};
