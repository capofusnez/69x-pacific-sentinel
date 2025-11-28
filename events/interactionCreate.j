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
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'Si è verificato un errore eseguendo il comando!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Si è verificato un errore eseguendo il comando!', ephemeral: true });
                }
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
                
                await interaction.reply({ content: "✅ Regole accettate! Benvenuto su Sakhal.", ephemeral: true });
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
    },
};

// Logica per i messaggi nei canali AI (non è un'interazione, ma un evento 'messageCreate')

client.on(Events.MessageCreate, async message => {
    if (message.author.bot || message.channel.type !== ChannelType.GuildText) return;
    
    const aiSessions = getData(config.FILES.AI_SESSIONS);
    
    if (aiSessions[message.channelId] && message.author.id === aiSessions[message.channelId].userId) {
        
        // AGGIORNA ATTIVITÀ AI
        aiSessions[message.channelId].lastActivity = Date.now();
        saveData(config.FILES.AI_SESSIONS, aiSessions);
        
        // INVIA A GEMINI
        await message.channel.sendTyping();
        try {
            const answer = await askGemini(message.content);
            await message.reply(answer);
        } catch (err) {
            if (err.message === "AI_UNAVAILABLE") {
                await message.reply(getAiUnavailableMessage());
            } else {
                console.error("Errore Gemini in sessione AI:", err);
                await message.reply("⚠ Errore comunicando con l'AI. Riprova più tardi.");
            }
        }
    }
});
