// commands/sendrules.js

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../config");
const { getRulesText, saveRulesMessageInfo } = require("../utils/serverUtils");

module.exports = {
    // Solo gli amministratori (o chi ha i permessi admin del bot) possono inviare questo
    data: new SlashCommandBuilder()
        .setName("sendrules")
        .setDescription("Invia il pannello di accettazione delle regole nel canale corrente.")
        .setDefaultMemberPermissions(0), // Disabilita l'uso per tutti tranne admin

    async execute(interaction) {
        // Controllo permessi aggiuntivo
        if (!interaction.member.permissions.has("Administrator")) {
             return interaction.reply({ content: "Non hai il permesso di usare questo comando.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        
        // 1. Prepara l'Embed e il Pulsante
        const rulesEmbed = new EmbedBuilder()
            .setTitle("📜 Regolamento Server – Rules")
            .setDescription(getRulesText())
            .setColor("#0099ff")
            .setFooter({ text: "DayZ Sentinel - Accetta per entrare nel server." });

        const acceptButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("rules_accept_fresh-spawn")
                .setLabel("✅ Accetta le Regole / Accept Rules")
                .setStyle(ButtonStyle.Success)
        );

        // 2. Invia il messaggio nel canale
        try {
            const rulesMessage = await interaction.channel.send({
                embeds: [rulesEmbed],
                components: [acceptButton]
            });
            
            // 3. Salva l'ID del messaggio per le verifiche
            saveRulesMessageInfo(interaction.guildId, interaction.channelId, rulesMessage.id);
            
            await interaction.editReply({ content: "✅ Pannello delle regole inviato e configurazione salvata!", ephemeral: true });
            
        } catch (error) {
            console.error("Errore nell'invio del pannello regole:", error);
            await interaction.editReply({ content: "⚠ Errore nell'invio del messaggio delle regole. Controlla che il bot abbia i permessi di invio.", ephemeral: true });
        }
    },
};
