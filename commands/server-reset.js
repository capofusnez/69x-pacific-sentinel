// commands/server-reset.js

const { SlashCommandBuilder } = require("discord.js");
const { saveData } = require("../utils/db");
const { getPermissions } = require("../utils/serverUtils");
const config = require("../config");

const DEFAULT_SERVER_CONFIG = {
  "name": "69x Pacific Land | Sakhal Full PvP",
  "ip": "0.0.0.0",
  "port": "0000",
  "slots": 0,
  "wipe": "Ogni 0 giorni",
  "restart": "Ogni 0 ore",
  "mods": "Trader, Custom Loot, Vehicles",
  "style": "Full PvP",
  "discord": "69x Pacific Land full PvP"
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("server-reset")
        .setDescription("⚠️ [ADMIN] Resetta la configurazione server alle impostazioni predefinite.")
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        const { allowedRoles } = getPermissions();
        
        if (!interaction.member.permissions.has("Administrator") && !interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
            return interaction.reply({ content: "Non hai il permesso di usare questo comando.", ephemeral: true });
        }

        saveData(config.FILES.SERVER_CONFIG, DEFAULT_SERVER_CONFIG);
        await interaction.reply({ content: "✅ La configurazione del server è stata resettata ai valori predefiniti.", ephemeral: true });
    },
};
