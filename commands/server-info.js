// commands/server-info.js

const { SlashCommandBuilder } = require("discord.js");
const { getServerInfoEmbed } = require("../utils/serverUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("server-info")
        .setDescription("Mostra le informazioni principali del server (IP, Wipe, Mods)."),

    async execute(interaction) {
        const infoEmbed = getServerInfoEmbed();
        
        await interaction.reply({ embeds: [infoEmbed], ephemeral: false });
    },
};
