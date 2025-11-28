// commands/xp-panel.js

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getPermissions } = require("../utils/serverUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("xp-panel")
        .setDescription("⭐ [ADMIN] Invia il pannello per il controllo XP (livello).")
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        const { allowedRoles } = getPermissions();
        
        if (!interaction.member.permissions.has("Administrator") && !interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
            return interaction.reply({ content: "Non hai il permesso di usare questo comando.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        
        const xpEmbed = new EmbedBuilder()
            .setTitle("⭐ Controllo Livello e XP")
            .setDescription(
                "Premi il pulsante qui sotto per vedere il tuo livello e i tuoi XP totali.\n" +
                "Guadagni XP semplicemente giocando a DayZ sul server."
            )
            .setColor("#FEE75C");
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("xp_check_level")
                .setLabel("📈 Controlla il mio Livello")
                .setStyle(ButtonStyle.Primary)
        );

        try {
            await interaction.channel.send({
                embeds: [xpEmbed],
                components: [row]
            });
            
            await interaction.editReply({ content: "✅ Pannello XP inviato!", ephemeral: true });
            
        } catch (error) {
            console.error("Errore nell'invio del pannello XP:", error);
            await interaction.editReply({ content: "⚠ Errore nell'invio del pannello XP.", ephemeral: true });
        }
    },
};
