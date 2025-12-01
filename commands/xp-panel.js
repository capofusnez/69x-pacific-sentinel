// commands/xp-panel.js

const Discord = require("discord.js");
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = Discord;

const { getPermissions } = require("../utils/serverUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("xp-panel")
        .setDescription("⭐ [ADMIN] Invia il pannello per il controllo XP (livello).")
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        const { allowedRoles } = getPermissions();
        
        // 1. Controllo Permessi (risposta privata)
        if (!interaction.member.permissions.has("Administrator") && !interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
            return interaction.reply({ 
                content: "Non hai il permesso di usare questo comando.", 
                flags: Discord.InteractionResponseFlags.Ephemeral
            });
        }

        // 2. Defer Reply (risposta privata)
        await interaction.deferReply({ flags: Discord.InteractionResponseFlags.Ephemeral }); 
        
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
            
            // 3. Risposta di successo (risposta privata)
            await interaction.editReply({ 
                content: "✅ Pannello XP inviato!", 
                flags: Discord.InteractionResponseFlags.Ephemeral
            });
            
        } catch (error) {
            console.error("Errore nell'invio del pannello XP:", error);
            
            // 4. Risposta di errore (risposta privata)
            await interaction.editReply({ 
                content: "⚠ Errore nell'invio del pannello XP.", 
                flags: Discord.InteractionResponseFlags.Ephemeral
            });
        }
    },
};
