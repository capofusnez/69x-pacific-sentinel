// commands/perm-list.js

const { SlashCommandBuilder } = require("discord.js");
const { getPermissions } = require("../utils/serverUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("perm-list")
        .setDescription("Mostra i ruoli correnti che possono eseguire comandi di gestione."),

    async execute(interaction) {
        const permissions = getPermissions();
        
        if (!permissions.allowedRoles || permissions.allowedRoles.length === 0) {
            return interaction.reply({ content: "Nessun ruolo speciale è attualmente configurato per l'accesso ai comandi di gestione.", ephemeral: true });
        }

        const roleMentions = permissions.allowedRoles.map(roleId => `<@&${roleId}>`).join('\n');
        
        const output = `**Ruoli Permessi:**\n${roleMentions}\n\n*Gli Amministratori (Administrator permission) hanno sempre accesso (ownerOverride: ${permissions.ownerOverride}).*`;

        await interaction.reply({ content: output, ephemeral: true });
    },
};
