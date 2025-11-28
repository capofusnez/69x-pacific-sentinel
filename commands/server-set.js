// commands/server-set.js

const { SlashCommandBuilder } = require("discord.js");
const { getData, saveData } = require("../utils/db");
const { getPermissions } = require("../utils/serverUtils");
const config = require("../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("server-set")
        .setDescription("⚙️ [ADMIN] Aggiorna un valore nella configurazione del server (IP, Wipe, ecc.).")
        .addStringOption(option =>
            option.setName("chiave")
                .setDescription("Il campo da modificare (es. ip, wipe, slots, name).")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("valore")
                .setDescription("Il nuovo valore da assegnare al campo.")
                .setRequired(true))
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        const { allowedRoles } = getPermissions();
        
        if (!interaction.member.permissions.has("Administrator") && !interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
            return interaction.reply({ content: "Non hai il permesso di usare questo comando.", ephemeral: true });
        }
        
        const key = interaction.options.getString("chiave").toLowerCase();
        const value = interaction.options.getString("valore");
        
        const serverConfig = getData(config.FILES.SERVER_CONFIG);
        
        if (!Object.keys(serverConfig).includes(key)) {
            return interaction.reply({ content: `⚠ Chiave "${key}" non valida. Le chiavi valide sono: ${Object.keys(serverConfig).join(', ')}.`, ephemeral: true });
        }

        // Conversione numerica se necessario
        if (key === 'slots' || key === 'port') {
            const numValue = parseInt(value);
            if (isNaN(numValue)) {
                return interaction.reply({ content: `⚠ Il valore per "${key}" deve essere un numero.`, ephemeral: true });
            }
            serverConfig[key] = numValue;
        } else {
            serverConfig[key] = value;
        }

        saveData(config.FILES.SERVER_CONFIG, serverConfig);
        await interaction.reply({ content: `✅ La chiave **${key}** è stata aggiornata a \`${serverConfig[key]}\`.`, ephemeral: true });
    },
};
