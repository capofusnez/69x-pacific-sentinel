// commands/xp-add.js

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getPermissions } = require("../utils/serverUtils");
const { addXP } = require('../utils/xpUtils'); // <-- IMPORTAZIONE CORRETTA

// Usiamo la flag numerica per Ephemeral
const EPHEMERAL_FLAG = 64; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName("xp-add")
        .setDescription("➕ [ADMIN] Aggiunge XP a un utente specifico.")
        .addUserOption(option => 
            option.setName('target')
                .setDescription('L\'utente a cui aggiungere XP.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('La quantità di XP da aggiungere.')
                .setRequired(true))
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        const { allowedRoles } = getPermissions();
        
        // 1. Controllo Permessi
        if (!interaction.member.permissions.has("Administrator") && !interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
            return interaction.reply({ 
                content: "Non hai il permesso di usare questo comando.", 
                flags: EPHEMERAL_FLAG
            });
        }

        const targetUser = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');
        const guildId = interaction.guildId;

        // 2. Aggiungi XP
        const newStats = addXP(targetUser.id, amount, guildId);

        // 3. Risposta
        const responseEmbed = new EmbedBuilder()
            .setTitle("➕ XP Aggiunti!")
            .setDescription(`Aggiunti **${amount} XP** a **${targetUser.username}**.`)
            .addFields(
                { name: 'Livello Attuale', value: `${newStats.level}`, inline: true },
                { name: 'XP Totali', value: `${newStats.xp}`, inline: true }
            )
            .setColor("#00FF00");

        await interaction.reply({ 
            embeds: [responseEmbed],
            flags: EPHEMERAL_FLAG
        });
    },
};
