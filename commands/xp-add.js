// commands/xp-add.js

const { SlashCommandBuilder } = require("discord.js");
const { addXP, getUserLevelInfo, updateRankRoles } = require("../utils/xpUtils");
const { getPermissions } = require("../utils/serverUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("xp-add")
        .setDescription("✨ [ADMIN] Aggiunge o sottrae XP a un utente.")
        .addUserOption(option =>
            option.setName("utente")
                .setDescription("L'utente a cui dare/togliere XP.")
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName("quantita")
                .setDescription("La quantità di XP da aggiungere (es. 100) o togliere (es. -50).")
                .setRequired(true))
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        const { allowedRoles } = getPermissions();
        
        if (!interaction.member.permissions.has("Administrator") && !interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
            return interaction.reply({ content: "Non hai il permesso di usare questo comando.", ephemeral: true });
        }

        const user = interaction.options.getUser("utente");
        const amount = interaction.options.getInteger("quantita");
        const guild = interaction.guild;

        if (user.bot) {
            return interaction.reply({ content: "Non puoi modificare l'XP di un bot.", ephemeral: true });
        }
        
        const member = await guild.members.fetch(user.id);
        const result = addXP(guild.id, user.id, amount);
        const oldLevel = getUserLevelInfo(guild.id, user.id).level;

        let replyMessage = `✅ Modificato XP di ${user.tag} di **${amount}**. `;

        if (result.leveledUp || result.newLevel < oldLevel) {
            replyMessage += `**Nuovo Livello: ${result.newLevel}**`;
            await updateRankRoles(guild, member, result.newLevel);
        } else {
             replyMessage += `XP Totali: ${result.xp}. Livello: ${oldLevel}`;
        }
        
        await interaction.reply({ content: replyMessage, ephemeral: true });
    },
};
