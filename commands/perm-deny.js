// commands/perm-deny.js

const { SlashCommandBuilder } = require("discord.js");
const { getData, saveData } = require("../utils/db");
const { getPermissions } = require("../utils/serverUtils");
const config = require("../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("perm-deny")
        .setDescription("Rimuove un ruolo che può eseguire comandi di gestione (Admin/Mod).")
        .addRoleOption(option =>
            option.setName("ruolo")
                .setDescription("Il ruolo da rimuovere dalla lista dei permessi.")
                .setRequired(true)),

    async execute(interaction) {
        // Controllo Permessi Owner o Ruoli già permessi
        if (!interaction.member.permissions.has("Administrator") && !getPermissions().ownerOverride) {
            return interaction.reply({ content: "Non hai il permesso di usare questo comando.", ephemeral: true });
        }
        
        const role = interaction.options.getRole("ruolo");
        const permissions = getData(config.FILES.PERMISSIONS);
        const index = permissions.allowedRoles.indexOf(role.id);
        
        if (index === -1) {
            return interaction.reply({ content: `Il ruolo ${role.name} non è nella lista dei permessi.`, ephemeral: true });
        }

        permissions.allowedRoles.splice(index, 1);
        saveData(config.FILES.PERMISSIONS, permissions);

        await interaction.reply({ content: `✅ Ruolo ${role.name} rimosso dalla lista dei ruoli permessi.`, ephemeral: true });
    },
};
