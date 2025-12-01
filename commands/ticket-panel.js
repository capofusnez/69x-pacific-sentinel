// commands/ticket-panel.js

const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require("discord.js");
const config = require("../config");
const { getPermissions } = require("../utils/serverUtils"); 

// Numero massimo di componenti (pulsanti) per ogni riga di azione di Discord (Max 5)
const MAX_COMPONENTS_PER_ROW = 5; 

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
        const ticketKeys = Object.keys(ticketTypes);

        if (ticketKeys.length === 0) {
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
            
        
        // --- 4. Creazione Pulsanti e Righe ---
        
        const actionRows = [];
        let currentRow = new ActionRowBuilder();
        let buttonsCount = 0;

        ticketKeys.forEach(key => {
            const typeInfo = ticketTypes[key];

            // Ignora i tipi di ticket che non hanno etichetta
            if (!typeInfo.label) return;

            // Se la riga corrente ha raggiunto il limite, ne creiamo una nuova
            if (buttonsCount >= MAX_COMPONENTS_PER_ROW) {
                actionRows.push(currentRow);
                currentRow = new ActionRowBuilder();
                buttonsCount = 0;
            }

            const button = new ButtonBuilder()
                .setCustomId(`ticket_create_${key}`)
                .setLabel(typeInfo.label) 
                .setStyle(typeInfo.style || ButtonStyle.Secondary);
            
            // Imposta l'emoji solo se è definita e valida (correzione dell'errore 'null')
            if (typeInfo.emoji && typeof typeInfo.emoji === 'string') {
                 button.setEmoji(typeInfo.emoji);
            }
            
            currentRow.addComponents(button);
            buttonsCount++;
        });

        // Aggiungi l'ultima riga se contiene pulsanti
        if (currentRow.components.length > 0) {
            actionRows.push(currentRow);
        }

        // Se non sono stati creati pulsanti validi, lancia un errore
        if (actionRows.length === 0) {
            return interaction.editReply({
                content: "❌ Errore: Nessun pulsante valido è stato creato dai tipi di ticket configurati.",
                ephemeral: true
            });
        }
        
        // --- 5. Invio del Messaggio ---
        try {
            await interaction.channel.send({
                embeds: [ticketEmbed],
                components: actionRows // Invia tutte le righe di azione generate
            });
            
            await interaction.editReply({ content: "✅ Pannello Ticket inviato!", ephemeral: true });
            
        } catch (error) {
            console.error("Errore nell'invio del pannello ticket:", error);
            await interaction.editReply({ content: "⚠ Errore nell'invio del pannello ticket.", ephemeral: true });
        }
    },
};
