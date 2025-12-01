// events/interactionCreate.js

const { Events, EmbedBuilder } = require('discord.js');
const config = require('../config');
// Funzioni XP (per il pulsante di check livello)
const { getUserLevelInfo } = require('../utils/xpUtils');
// Funzione AI (per il pulsante di avvio sessione)
const { createAiSession } = require('../commands/ai'); 
// NB: Assicurati che il file /commands/ai.js esista e che esporti la funzione createAiSession!

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction) {
        
        // ----------------------------------------------------------------------------------
        // 1. GESTIONE COMANDI SLASH
        // ----------------------------------------------------------------------------------
        if (interaction.isCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`Nessun comando trovato con il nome ${interaction.commandName}`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Errore nell'esecuzione del comando ${interaction.commandName}`);
                console.error(error);
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: 'Si è verificato un errore durante l\'esecuzione di questo comando!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Si è verificato un errore durante l\'esecuzione di questo comando!', ephemeral: true });
                }
            }
            return;
        }


        // ----------------------------------------------------------------------------------
        // 2. GESTIONE PULSANTI (Buttons)
        // ----------------------------------------------------------------------------------
        if (interaction.isButton()) {
            const customId = interaction.customId;
            const guildId = interaction.guildId;
            const member = interaction.member;

            // --- A. Gestione Pulsante Avvio Chat AI (ID: start_ai_session) ---
            if (customId === 'start_ai_session') {
                // Chiama la funzione centralizzata che crea il canale e registra la sessione
                await interaction.deferReply({ ephemeral: true });
                return await createAiSession(interaction);
            }
            
            // --- B. Gestione Pulsante Check XP/Livello (ID: check_my_xp) ---
            if (customId === 'check_my_xp') { 
                await interaction.deferReply({ ephemeral: true });
                
                try {
                    // getUserLevelInfo è stata la funzione che abbiamo corretto in xpUtils.js
                    const { xp, level, nextLevelXp, progressPercent } = getUserLevelInfo(guildId, member.id);
                    
                    const rankEmbed = new EmbedBuilder()
                        .setColor('#F1C40F')
                        .setTitle(`🎖️ Statistiche Livello di ${member.user.username}`)
                        .setDescription(`Sei al livello **${level}**!`)
                        .addFields(
                            { name: '✨ XP Totali', value: `${xp} XP`, inline: true },
                            { name: '➡️ XP per Prossimo Livello', value: `${nextLevelXp} XP`, inline: true },
                            { name: '\u200B', value: '\u200B', inline: false },
                            { name: 'Progresso', value: `\`[${'█'.repeat(Math.floor(progressPercent / 10))}${' '.repeat(10 - Math.floor(progressPercent / 10))}]\` (${progressPercent}%)` },
                        )
                        .setFooter({ text: 'L\'XP viene aggiornato giocando a DayZ o inviando messaggi.' });

                    return interaction.editReply({ embeds: [rankEmbed], ephemeral: true });
                } catch (error) {
                    console.error("Errore nel pulsante check_my_xp:", error);
                    return interaction.editReply({ content: 'Errore nel recupero delle tue statistiche XP.', ephemeral: true });
                }
            }


            // --- C. Gestione Pulsanti Ticket (Placeholder) ---
            
            // Logica per i pulsanti di chiusura/trascrizione ticket
            if (customId === 'close_ticket') {
                // Logica del Ticket Handler
                // return;
            }
            
            // Logica per i pulsanti di apertura ticket
            const ticketType = config.TICKET_TYPES[customId];
            if (ticketType) {
                // Logica del Ticket Handler per creare il canale
                // return;
            }

            // Se nessun pulsante è stato gestito, rispondi per evitare timeout
            return interaction.reply({ content: 'Azione pulsante non riconosciuta.', ephemeral: true });
        }


        // ----------------------------------------------------------------------------------
        // 3. GESTIONE SELEZIONE (Select Menus)
        // ----------------------------------------------------------------------------------
        if (interaction.isStringSelectMenu()) {
            // Logica per Select Menus (Se ne hai bisogno in futuro)
            return;
        }
    },
};
