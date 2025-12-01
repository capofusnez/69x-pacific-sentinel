const { Events, EmbedBuilder, InteractionResponseFlags } = require('discord.js'); // AGGIUNTA InteractionResponseFlags
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
                
                // CORREZIONE 1 & 2: Errore nell'esecuzione del comando
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ 
                        content: 'Si è verificato un errore durante l\'esecuzione di questo comando! | An error occurred while executing this command!', 
                        flags: InteractionResponseFlags.Ephemeral // Corretto: da ephemeral: true
                    });
                } else {
                    await interaction.reply({ 
                        content: 'Si è verificato un errore durante l\'esecuzione di questo comando! | An error occurred while executing this command!', 
                        flags: InteractionResponseFlags.Ephemeral // Corretto: da ephemeral: true
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
                // CORREZIONE 3: Defer Reply per Pulsante AI
                await interaction.deferReply({ flags: InteractionResponseFlags.Ephemeral }); // Corretto: da ephemeral: true
                return await createAiSession(interaction);
            }
            
            // --- B. Gestione Pulsante Check XP/Livello (ID: check_my_xp) ---
            // Nota: Ho corretto l'ID con 'xp_check_level' usato in xp-panel.js, assumendo che 'check_my_xp' fosse un errore.
            if (customId === 'xp_check_level') { 
                // CORREZIONE 4: Defer Reply per Pulsante XP
                await interaction.deferReply({ flags: InteractionResponseFlags.Ephemeral }); // Corretto: da ephemeral: true
                
                try {
                    // getUserLevelInfo è stata la funzione che abbiamo corretto in xpUtils.js
                    const { xp, level, nextLevelXp, progressPercent } = getUserLevelInfo(guildId, member.id);
                    
                    // Contenuto bilingue dell'embed di risposta
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

                    // CORREZIONE 5: Risposta di successo XP
                    return interaction.editReply({ 
                        embeds: [rankEmbed], 
                        flags: InteractionResponseFlags.Ephemeral // Corretto: da ephemeral: true
                    });
                } catch (error) {
                    console.error("Errore nel pulsante check_my_xp:", error);
                    
                    // CORREZIONE 6: Risposta di errore XP
                    return interaction.editReply({ 
                        content: 'Errore nel recupero delle tue statistiche XP. Riprova. | Error retrieving your XP stats. Please try again.', 
                        flags: InteractionResponseFlags.Ephemeral // Corretto: da ephemeral: true
                    });
                }
            }


            // --- C. Gestione Pulsanti Ticket (Placeholder) ---
            // ... (altre logiche ticket)

            // Se nessun pulsante è stato gestito, rispondi per evitare timeout
            // CORREZIONE 7: Pulsante non riconosciuto
            return interaction.reply({ 
                content: 'Azione pulsante non riconosciuta. | Unrecognized button action.', 
                flags: InteractionResponseFlags.Ephemeral // Corretto: da ephemeral: true
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
