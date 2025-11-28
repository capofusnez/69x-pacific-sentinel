// events/interactionCreate.js (Estratto: Modifica il blocco di gestione dei comandi slash)

// ... (altre righe sopra)

        // Gestione Comandi Slash
        if (interaction.isChatInputCommand()) {
            const command = commandHandler.getCommands().get(interaction.commandName);

            if (!command) {
                console.error(`Nessun comando trovato per ${interaction.commandName}.`);
                return;
            }

            try {
                // Tenta di eseguire il comando
                await command.execute(interaction, client);
                
            } catch (error) {
                // --- INIZIO GESTIONE AVVISO/ERRORE ---
                console.error(`💥 Errore nell'esecuzione del comando /${interaction.commandName}:`, error);

                const adminUser = await client.users.fetch('IL_TUO_ID_UTENTE_DISCORD'); // <-- ⚠️ SOSTITUISCI CON IL TUO ID
                
                // 1. Notifica l'utente che il comando ha fallito (messaggio effimero)
                const userErrorMsg = '⚠️ Si è verificato un errore eseguendo il comando! Lo staff è stato avvisato.';
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: userErrorMsg, ephemeral: true }).catch(() => {});
                } else {
                    await interaction.reply({ content: userErrorMsg, ephemeral: true }).catch(() => {});
                }

                // 2. Notifica l'amministratore (te) tramite messaggio privato (DM)
                if (adminUser) {
                    const dmMessage = 
                        `🚨 **ERRORE CRITICO NON BLUCCANTE**\n` +
                        `**Comando fallito:** /${interaction.commandName}\n` +
                        `**Utente:** ${interaction.user.tag} (${interaction.user.id})\n` +
                        `**Errore Dettagliato:** \`\`\`\n${error.stack ? error.stack.substring(0, 1000) : error.message}\n\`\`\``;
                    
                    adminUser.send(dmMessage).catch(err => console.error("Impossibile inviare DM all'admin:", err));
                }
                // --- FINE GESTIONE AVVISO/ERRORE ---
            }
            return;
        }
// ... (continua con la gestione dei pulsanti e del client.on)
