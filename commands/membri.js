// commands/membri.js

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("membri")
        .setDescription("📊 Mostra il conteggio aggiornato degli utenti e dei bot nel server."),

    async execute(interaction) {
        // Differisce la risposta per dare tempo al bot di recuperare tutti i membri
        await interaction.deferReply(); 

        const guild = interaction.guild;

        // 1. Recupera tutti i membri per statistiche aggiornate (CRUCIALE!)
        const members = await guild.members.fetch();

        // 2. Calcola le statistiche
        const totalMembers = guild.memberCount;
        const onlineMembers = members.filter(member => member.presence?.status !== 'offline').size;
        const humanMembers = members.filter(member => !member.user.bot).size;
        const botMembers = members.filter(member => member.user.bot).size;
        
        // 3. Creazione dell'Embed
        const infoEmbed = new EmbedBuilder()
            .setColor('#3498DB') 
            .setTitle(`Conteggio Membri di ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '👥 Membri Totali', value: `**${totalMembers}**`, inline: true },
                { name: '🟢 Online/Attivi', value: `**${onlineMembers}**`, inline: true },
                { name: '\u200B', value: '\u200B', inline: true }, // Campo vuoto per spaziatura
                { name: '👤 Utenti Umani', value: `${humanMembers}`, inline: true },
                { name: '🤖 Bot', value: `${botMembers}`, inline: true },
                { name: '\u200B', value: '\u200B', inline: true }, 
            )
            .setFooter({ text: `Ultimo aggiornamento: ${new Date().toLocaleTimeString('it-IT')}` });

        await interaction.editReply({ embeds: [infoEmbed] });
    },
};
