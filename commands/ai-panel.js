// commands/ai-panel.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ai-panel')
        .setDescription('🧠 Invia il pannello interattivo per avviare una chat AI.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Solo gli admin possono usare

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle('🤖 Avvia una Sessione di Chat AI')
            .setDescription('Premi il pulsante qui sotto per avviare un canale di chat privato con Gemini AI. La tua sessione sarà visibile solo a te e allo staff e terminerà dopo un periodo di inattività.');

        const button = new ButtonBuilder()
            .setCustomId('start_ai_session')
            .setLabel('Inizia Chat AI')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🧠');

        const row = new ActionRowBuilder().addComponents(button);

        // Invia il pannello nel canale corrente
        await interaction.channel.send({
            embeds: [embed],
            components: [row]
        });

        return interaction.editReply({ content: 'Pannello Chat AI inviato con successo!', ephemeral: true });
    },
};
