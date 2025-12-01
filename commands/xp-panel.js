// commands/xp-panel.js

const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    InteractionResponseFlags // <-- CORREZIONE: Ora è importato correttamente
} = require("discord.js");
const { getPermissions } = require("../utils/serverUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("xp-panel")
        .setDescription("⭐ [ADMIN] Invia il pannello per il controllo XP (livello).")
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        const { allowedRoles } = getPermissions();
        
        // Risposta di permesso negato
        if (!interaction.member.permissions.has("Administrator") && !interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
            return interaction.reply({ 
                content: "Non hai il permesso di usare questo comando.", 
                flags: InteractionResponseFlags.Ephemeral // Corretto
            });
        }

        // Defer Reply
        await interaction.deferReply({ flags: InteractionResponseFlags.Ephemeral }); // Corretto
        
        const xpEmbed = new EmbedBuilder()
            .setTitle("⭐ 📈 Controllo Livello e XP | Level and XP Check")
            .setDescription(
                "**IT (Italiano):**\n" +
                "Premi il pulsante qui sotto per vedere il tuo livello e i tuoi XP totali.\n" +
                "Guadagni XP semplicemente giocando a DayZ sul server.\n" +
                "\n"+
                "**EN (English):**\n" +
                "Press the button below to view your current level and total XP.\n" +
                "You earn XP simply by **playing DayZ** on the server and **chatting** with the community!"
            )
            .setColor("#FEE75C");
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("xp_check_level")
                .setLabel("📈 Controlla XP / Check XP")
                .setStyle(ButtonStyle.Primary)
        );

        try {
            await interaction.channel.send({
                embeds: [xpEmbed],
                components: [row]
            });
            
            // Risposta di successo
            await interaction.editReply({ 
                content: "✅ Pannello XP inviato!", 
                flags: InteractionResponseFlags.Ephemeral // Corretto
            });
            
        } catch (error) {
            console.error("Errore nell'invio del pannello XP:", error);
            
            // Risposta di errore
            await interaction.editReply({ 
                content: "⚠ Errore nell'invio del pannello XP.", 
                flags: InteractionResponseFlags.Ephemeral // Corretto
            });
        }
    },
};
