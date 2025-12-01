// events/interactionCreate.js

const { Events, EmbedBuilder } = require('discord.js');
const config = require('../config');
const { getUserLevelInfo } = require('../utils/xpUtils');
const { createAiSession } = require('../commands/ai');

// ⭐ AGGIORNA L'IMPORTAZIONE DEL GESTORE TICKET ⭐
const { createTicketChannel, closeTicket } = require('./ticketCreate'); 

// La flag Ephemeral è rappresentata dal valore numerico 64.
const EPHEMERAL_FLAG = 64;

module.exports = {
// ...
// ... (omesso il codice) ...
// ...

        // ----------------------------------------------------------------------------------
        // 2. GESTIONE PULSANTI (Buttons)
        // ----------------------------------------------------------------------------------
        if (interaction.isButton()) {
            const customId = interaction.customId;
            // ... (altre variabili) ...

            // ... (omesso A e B) ...

            // ⭐ C. Gestione Pulsanti Ticket (ticket_create_...) ⭐
            if (customId.startsWith('ticket_create_')) {
                return await createTicketChannel(interaction);
            }

            // ⭐ D. Gestione Pulsante Chiusura Ticket (ticket_close) ⭐
            if (customId === 'ticket_close') {
                // ⭐ CHIAMA LA NUOVA FUNZIONE DI CHIUSURA ⭐
                return await closeTicket(interaction); 
            }

            // --- E. Risposta predefinita per pulsante non riconosciuto ---
            return interaction.reply({ 
                content: 'Azione pulsante non riconosciuta. | Unrecognized button action.', 
                flags: EPHEMERAL_FLAG // Usiamo il numero 64
            });
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
                await interaction.deferReply({ flags: EPHEMERAL_FLAG }); // Usiamo il numero 64
                return await createAiSession(interaction);
            }
            
            // --- B. Gestione Pulsante Check XP/Livello (ID: xp_check_level) ---
            if (customId === 'xp_check_level') { 
                await interaction.deferReply({ flags: EPHEMERAL_FLAG }); // Usiamo il numero 64
                
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
                        flags: EPHEMERAL_FLAG // Usiamo il numero 64
                    });
                } catch (error) {
                    console.error("Errore nel pulsante check_my_xp:", error);
                    
                    // Risposta di errore XP (risposta privata)
                    return interaction.editReply({ 
                        content: 'Errore nel recupero delle tue statistiche XP. Riprova. | Error retrieving your XP stats. Please try again.', 
                        flags: EPHEMERAL_FLAG // Usiamo il numero 64
                    });
                }
            }

            // ⭐ C. Gestione Pulsanti Ticket (ticket_create_...) ⭐
            if (customId.startsWith('ticket_create_')) {
                // Chiama la funzione di creazione ticket. La deferReply è gestita all'interno di createTicketChannel
                // L'uso di flags: EPHEMERAL_FLAG è implicito nella funzione createTicketChannel per la risposta iniziale.
                return await createTicketChannel(interaction);
            }

            // ⭐ D. Gestione Pulsante Chiusura Ticket (ticket_close) ⭐
            if (customId === 'ticket_close') {
                // Se hai intenzione di creare una funzione dedicata per la chiusura (es. closeTicket), la chiameresti qui.
                // Per ora, diamo una risposta per evitare l'errore "Azione non riconosciuta"
                // await closeTicket(interaction);
                return interaction.reply({ content: "Logica di chiusura ticket in fase di implementazione (ID: ticket_close)...", ephemeral: true });
            }

            // --- E. Risposta predefinita per pulsante non riconosciuto ---
            return interaction.reply({ 
                content: 'Azione pulsante non riconosciuta. | Unrecognized button action.', 
                flags: EPHEMERAL_FLAG // Usiamo il numero 64
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
