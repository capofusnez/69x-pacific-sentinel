// commands/perm-allow.js

const { SlashCommandBuilder } = require("discord.js");
const { getData, saveData } = require("../utils/db");
const { getPermissions } = require("../utils/serverUtils");
const config = require("../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("perm-allow")
        .setDescription("Aggiunge un ruolo che può eseguire comandi di gestione (Admin/Mod).")
        .addRoleOption(option =>
            option.setName("ruolo")
                .setDescription("Il ruolo da aggiungere alla lista dei permessi.")
                .setRequired(true)),

    async execute(interaction) {
        // Controllo Permessi Owner o Ruoli già permessi
        if (!interaction.member.permissions.has("Administrator") && !getPermissions().ownerOverride) {
            return interaction.reply({ content: "Non hai il permesso di usare questo comando.", ephemeral: true });
        }
        
        const role = interaction.options.getRole("ruolo");
        const permissions = getData(config.FILES.PERMISSIONS);
        
        if (permissions.allowedRoles.includes(role.id)) {
            return interaction.reply({ content: `Il ruolo ${role.name} è già nella lista dei permessi.`, ephemeral: true });
        }

        permissions.allowedRoles.push(role.id);
        saveData(config.FILES.PERMISSIONS, permissions);

        await interaction.reply({ content: `✅ Ruolo ${role.name} aggiunto alla lista dei ruoli permessi.`, ephemeral: true });
    },
};
