// commands/ticket-panel.js

const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require("discord.js");
const config = require("../config");
const { getPermissions } = require("../utils/serverUtils"); // Mantengo la tua importazione

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-panel")
        .setDescription("📩 [ADMIN] Invia il pannello per aprire i ticket nel canale corrente.")
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        // --- 1. Controllo Permessi ---
        const { allowedRoles } = getPermissions();
        
        if (!interaction.member.permissions.has("Administrator") && !interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
            return interaction.reply({ content: "Non hai il permesso di usare questo comando.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        
        // --- 2. Verifica Configurazione ---
        const ticketTypes = config.TICKET_TYPES;
        if (!ticketTypes || Object.keys(ticketTypes).length === 0) {
            return interaction.editReply({
                content: "❌ Errore: Nessun tipo di ticket è configurato in config.js.",
                ephemeral: true
            });
        }
        
        // --- 3. Creazione Embed ---
        const ticketEmbed = new EmbedBuilder()
            .setTitle("📩 Apri un Ticket di Supporto")
            .setDescription(
                "🇮🇹 Seleziona il tipo di supporto di cui hai bisogno (Generale, Bug, Segnalazione, etc.).\n" +
                "🇬🇧 Select the type of support you need (General, Bug, Report, etc.).\n\n" +
                "Solo lo staff e tu potrete vedere il canale creato."
            )
            .setColor("#3498db");
            
        const row = new ActionRowBuilder();
        
        // --- 4. Creazione Pulsanti (Logica Semplificata e Robusta) ---
        
        // Itera sui tipi di ticket configurati e crea i pulsanti
        Object.keys(ticketTypes).slice(0, 5).forEach(key => {
            const typeInfo = ticketTypes[key];
            
            // Verifica che il tipo di ticket abbia almeno un'etichetta (label)
            if (!typeInfo.label) {
                console.warn(`[TICKET PANEL] Tipo di ticket '${key}' saltato: manca l'etichetta (label).`);
                return;
            }

            const button = new ButtonBuilder()
                .setCustomId(`ticket_create_${key}`)
                .setLabel(typeInfo.label) // Usa direttamente l'etichetta
                .setStyle(typeInfo.style || ButtonStyle.Secondary); // Usa lo stile se definito, altrimenti Secondary
            
            // ⭐ CORREZIONE DELL'ERRORE: Imposta l'emoji SOLO SE ESISTE ⭐
            if (typeInfo.emoji && typeof typeInfo.emoji === 'string') {
                 button.setEmoji(typeInfo.emoji);
            }
            
            row.addComponents(button);
        });

        // Se nessun pulsante valido è stato creato
        if (row.components.length === 0) {
            return interaction.editReply({
                content: "❌ Errore: Nessun pulsante valido è stato creato dai tipi di ticket configurati.",
                ephemeral: true
            });
        }

        // --- 5. Invio del Messaggio ---
        try {
            await interaction.channel.send({
                embeds: [ticketEmbed],
                components: [row]
            });
            
            await interaction.editReply({ content: "✅ Pannello Ticket inviato!", ephemeral: true });
            
        } catch (error) {
            console.error("Errore nell'invio del pannello ticket:", error);
            await interaction.editReply({ content: "⚠ Errore nell'invio del pannello ticket.", ephemeral: true });
        }
    },
};
