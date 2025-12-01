// commands/xp-add.js

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
// Assumo che tu abbia un file serverUtils con getPermissions
const { getPermissions } = require('../utils/serverUtils'); 
const { addXP, updateUserRole, calculateLevel } = require('../utils/xpUtils'); // <-- AGGIUNTA updateUserRole e calculateLevel

const EPHEMERAL_FLAG = 64; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName("xp-add") // Mantengo il nome originale, ma potresti volerlo cambiare in 'xp' con subcommands
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
        // ... (Controllo permessi e recupero opzioni)
        // Se non hai getPermissions, usa il tuo vecchio controllo admin

        const targetUser = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');
        
        // 1. Aggiungi XP
        const newStats = addXP(targetUser.id, amount, interaction.guildId);

        // 2. ⭐ AGGIORNAMENTO RUOLI FORZATO E LOG ⭐
        const guildMember = interaction.guild.members.cache.get(targetUser.id);
        
        if (guildMember) {
            // Ricalcola il livello corretto (che include i punti appena aggiunti)
            const correctLevel = calculateLevel(newStats.xp); 
            
            // Chiama la funzione di aggiornamento, che ora stamperà i log
            await updateUserRole(guildMember, correctLevel); 
            
            // Aggiorna l'embed con le statistiche corrette
            newStats.level = correctLevel; 
        }

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
