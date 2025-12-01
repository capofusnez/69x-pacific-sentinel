// events/interactionCreate.js

const { 
    Events, 
    EmbedBuilder, 
    // Rimuovi InteractionResponseFlags qui
    ...Discord // <-- Importa l'intero modulo Discord.js come "Discord"
} = require('discord.js'); 

const config = require('../config');
const { getUserLevelInfo } = require('../utils/xpUtils');
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
                
                const errorMessage = 'Si è verificato un errore durante l\'esecuzione di questo comando! | An error occurred while executing this command!';
                
                // Gestione errori comandi slash (risposta privata)
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ 
                        content: errorMessage, 
                        flags: Discord.InteractionResponseFlags.Ephemeral // <-- NUOVA SINTASSI
                    });
                } else {
                    await interaction.reply({ 
                        content: errorMessage, 
                        flags: Discord.InteractionResponseFlags.Ephemeral // <-- NUOVA SINTASSI
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
                await interaction.deferReply({ flags: Discord.InteractionResponseFlags.Ephemeral }); // <-- NUOVA SINTASSI
                return await createAiSession(interaction);
            }
            
            // --- B. Gestione Pulsante Check XP/Livello (ID: xp_check_level) ---
            if (customId === 'xp_check_level') { 
                await interaction.deferReply({ flags: Discord.InteractionResponseFlags.Ephemeral }); // <-- NUOVA SINTASSI
                
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

                    // Risposta di successo XP (risposta privata)
                    return interaction.editReply({ 
                        embeds: [rankEmbed], 
                        flags: Discord.InteractionResponseFlags.Ephemeral // <-- NUOVA SINTASSI
                    });
                } catch (error) {
                    console.error("Errore nel pulsante check_my_xp:", error);
                    
                    // Risposta di errore XP (risposta privata)
                    return interaction.editReply({ 
                        content: 'Errore nel recupero delle tue statistiche XP. Riprova. | Error retrieving your XP stats. Please try again.', 
                        flags: Discord.InteractionResponseFlags.Ephemeral // <-- NUOVA SINTASSI
                    });
                }
            }


            // --- C. Gestione Pulsanti Ticket (Placeholder) ---
            
            // Risposta per pulsante non riconosciuto (risposta privata)
            return interaction.reply({ 
                content: 'Azione pulsante non riconosciuta. | Unrecognized button action.', 
                flags: Discord.InteractionResponseFlags.Ephemeral // <-- NUOVA SINTASSI
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
