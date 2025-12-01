// events/interactionCreate.js

const { Events, EmbedBuilder, InteractionResponseFlags } = require('discord.js'); // <-- CORREZIONE: InteractionResponseFlags è qui!
const config = require('../config');
// Funzioni XP (per il pulsante di check livello)
const { getUserLevelInfo } = require('../utils/xpUtils');
// Funzione AI (per il pulsante di avvio sessione)
const { createAiSession } = require('../commands/ai');

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
                
                // Errore nell'esecuzione del comando
                const errorMessage = 'Si è verificato un errore durante l\'esecuzione di questo comando! | An error occurred while executing this command!';
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ 
                        content: errorMessage, 
                        flags: InteractionResponseFlags.Ephemeral // Corretto
                    });
                } else {
                    await interaction.reply({ 
                        content: errorMessage, 
                        flags: InteractionResponseFlags.Ephemeral // Corretto
                    });
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
                await interaction.deferReply({ flags: InteractionResponseFlags.Ephemeral }); // Corretto
                return await createAiSession(interaction);
            }
            
            // --- B. Gestione Pulsante Check XP/Livello (ID: xp_check_level) ---
            if (customId === 'xp_check_level') { // Assumiamo 'xp_check_level' come customId corretto
                await interaction.deferReply({ flags: InteractionResponseFlags.Ephemeral }); // Corretto
                
                try {
                    const { xp, level, nextLevelXp, progressPercent } = getUserLevelInfo(guildId, member.id);
                    
                    const rankEmbed = new EmbedBuilder()
                        .setColor('#F1C40F')
                        .setTitle(`🎖️ Statistiche Livello | Level Stats for ${member.user.username}`)
                        .setDescription(`**IT:** Sei al livello **${level}**! | **EN:** You are Level **${level}**!`)
                        .addFields(
                            { name: '✨ XP Totali / Total XP', value: `${xp} XP`, inline: true },
                            { name: '➡️ XP per Prossimo Livello / XP to Next Level', value: `${nextLevelXp} XP`, inline: true },
                            { name: '\u200B', value: '\u200B', inline: false },
                            { 
                                name: 'Progresso / Progress', 
                                value: `\`[${'█'.repeat(Math.floor(progressPercent / 10))}${' '.repeat(10 - Math.floor(progressPercent / 10))}]\` (${progressPercent}%)` 
                            },
                        )
                        .setFooter({ text: 'L\'XP viene aggiornato giocando a DayZ o inviando messaggi. | XP updates by playing DayZ or sending messages.' });

                    // Risposta di successo XP
                    return interaction.editReply({ 
                        embeds: [rankEmbed], 
                        flags: InteractionResponseFlags.Ephemeral // Corretto
                    });
                } catch (error) {
                    console.error("Errore nel pulsante check_my_xp:", error);
                    
                    // Risposta di errore XP
                    return interaction.editReply({ 
                        content: 'Errore nel recupero delle tue statistiche XP. Riprova. | Error retrieving your XP stats. Please try again.', 
                        flags: InteractionResponseFlags.Ephemeral // Corretto
                    });
                }
            }


            // --- C. Gestione Pulsanti Ticket (Placeholder) ---
            // Se nessun pulsante è stato gestito, rispondi per evitare timeout
            return interaction.reply({ 
                content: 'Azione pulsante non riconosciuta. | Unrecognized button action.', 
                flags: InteractionResponseFlags.Ephemeral // Corretto
            });
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
