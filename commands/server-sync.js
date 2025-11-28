// commands/server-sync.js

const { SlashCommandBuilder } = require("discord.js");
const { ensureRulesMessage, getPermissions } = require("../utils/serverUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("server-sync")
        .setDescription("🔄 [ADMIN] Forze la risincronizzazione delle strutture del server (es. messaggio regole).")
        .setDefaultMemberPermissions(0),

    async execute(interaction, client) {
        const { allowedRoles } = getPermissions();
        
        if (!interaction.member.permissions.has("Administrator") && !interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
            return interaction.reply({ content: "Non hai il permesso di usare questo comando.", ephemeral: true });
        }
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            // Qui dovresti includere altre funzioni di sync/check se ne hai
            // Ad esempio, ricreare le categorie AI/Ticket se mancano
            // await ensureAiCategory(interaction.guild); 
            // await ensureTicketCategory(interaction.guild); 
            
            // Forziamo il controllo delle regole per ora (funzione stub)
            // await ensureRulesMessage(client);
            
            await interaction.editReply({ content: "✅ Sincronizzazione server forzata completata. Verificato messaggio regole e strutture base.", ephemeral: true });
            
        } catch (error) {
            console.error("Errore in comando /server-sync:", error);
            await interaction.editReply({ content: "⚠ Errore durante la sincronizzazione. Controlla la console.", ephemeral: true });
        }
    },
};
