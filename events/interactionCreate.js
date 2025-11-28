// events/interactionCreate.js

const { Events, ChannelType } = require("discord.js");
const commandHandler = require("../handlers/commandHandler");
const config = require("../config");
const { getUserLevelInfo, updateRankRoles } = require("../utils/xpUtils");
const { getData, saveData } = require("../utils/db");
const { createTicketChannel, moveTicketToArchive } = require("../utils/serverUtils");
const { askGemini, getAiUnavailableMessage } = require("../utils/gemini");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        
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
                // --- INIZIO GESTIONE AVVISO/ERRORE (Protezione da crash) ---
                console.error(`💥 Errore nell'esecuzione del comando /${interaction.commandName}:`, error);

                // ⚠️ SOSTITUISCI QUESTO ID con il tuo ID Utente Discord per ricevere i DM di errore
                const adminUser = await client.users.fetch('IL_TUO_ID_UTENTE_DISCORD').catch(() => null); 
                
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
                        `🚨 **ERRORE CRITICO NON BLOCCANTE**\n` +
                        `**Comando fallito:** /${interaction.commandName}\n` +
                        `**Utente:** ${interaction.user.tag} (${interaction.user.id})\n` +
                        `**Errore Dettagliato:** \`\`\`\n${error.stack ? error.stack.substring(0, 1000) : error.message}\n\`\`\``;
                    
                    adminUser.send(dmMessage).catch(err => console.error("Impossibile inviare DM all'admin:", err));
                }
                // --- FINE GESTIONE AVVISO/ERRORE ---
            }
            return;
        }

        // Gestione Pulsanti (Buttons)
        if (interaction.isButton()) {
            const [type, action, value] = interaction.customId.split("_");
            const guild = interaction.guild;
            const member = interaction.member;

            if (type === "rules" && action === "accept") {
                // LOGICA ACCETTAZIONE REGOLE
                const rulesInfo = getData(config.FILES.RULES_MESSAGE);
                if (interaction.message.id !== rulesInfo.messageId) return;

                const role = guild.roles.cache.get(config.FRESH_SPAWN_ROLE_ID);
                if (!role) {
                    return interaction.reply({ content: "⚠ Ruolo Fresh Spawn non trovato. Contatta lo staff.", ephemeral: true });
                }
                
                if (member.roles.cache.has(role.id)) {
                    return interaction.reply({ content: "Hai già accettato le regole.", ephemeral: true });
                }

                await member.roles.add(role).catch(err => console.error("Errore assegnazione ruolo:", err));
                await updateRankRoles(guild, member, 0); 

                // --- LOGICA: NOTIFICA PUBBLICA NEL CANALE NUOVI UTENTI (Stile DayZ) ---
                const newUserChannel = guild.channels.cache.get(config.NEW_USER_CHANNEL_ID);
                
                if (newUserChannel) {
                    const notificationMessage = 
                        `🚨 **Nuovo sopravvissuto è atterrato su Sakhal!**\n` +
                        `Benvenuto ${member.user} su **${guild.name}** | Full PvP.\n` +
                        `\n` +
                        `🇬🇧 **New survivor just joined Sakhal!**\n` +
                        `Welcome ${member.user} to **${guild.name}** | Full PvP.`;
                    
                    await newUserChannel.send(notificationMessage).catch(err => console.error("Errore invio notifica benvenuto:", err));
                }
                // --- FINE LOGICA ---
                
                await interaction.reply({ content: "✅ Regole accettate! Benvenuto su Sakhal. Ora puoi accedere agli altri canali.", ephemeral: true });
                return;
            }

            if (type === "ticket" && action === "create") {
                // LOGICA CREAZIONE TICKET
                await interaction.deferReply({ ephemeral: true });
                
                try {
                     const channel = await createTicketChannel(guild, interaction.user, value);
                     await interaction.editReply({ content: `🎫 Il tuo ticket è stato creato: ${channel}` });
                } catch(err) {
                     console.error("Errore creazione ticket:", err);
                     await interaction.editReply("⚠ Errore durante la creazione del ticket. Riprova più tardi.");
                }
                return;
            }

            if (type === "ticket" && action === "close") {
                // LOGICA CHIUSURA TICKET
                // Controllo se il canale è un ticket (basato sul topic)
                if (interaction.channel.topic && interaction.channel.topic.includes("Ticket")) {
                    await interaction.deferReply({ ephemeral: false });
                    await interaction.editReply("🔒 Archiviazione e chiusura del ticket in corso...");
                    await moveTicketToArchive(interaction.channel);
                    await interaction.editReply("✅ Ticket archiviato! Il canale verrà eliminato a breve (o bloccato).");
                } else {
                    await interaction.reply({ content: "Questo non sembra un canale ticket.", ephemeral: true });
                }
                return;
            }
            
            if (type === "xp" && action === "check") {
                 // LOGICA CONTROLLO XP
                const info = getUserLevelInfo(guild.id, member.id);
                await interaction.reply({ content: `📈 **Livello:** ${info.level}\n**XP Totali:** ${info.xp}\n**Progresso:** ${info.progressPercent}% al prossimo livello.`, ephemeral: true });
                return;
            }
        }
    }, // <--- Chiude la funzione execute(interaction, client)
}; // <--- Chiude module.exports

