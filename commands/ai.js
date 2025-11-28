// commands/ai.js

const { SlashCommandBuilder } = require("discord.js");
const { createAiChannel } = require("../utils/serverUtils");
const { AI_STATUS } = require("../utils/gemini");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ai")
        .setDescription("Crea un canale personale per parlare con l'AI"),

    async execute(interaction) {
        if (!AI_STATUS.available) {
            return interaction.reply({ content: "⚠ L'assistente AI non è disponibile in questo momento.", ephemeral: true });
        }
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const channel = await createAiChannel(interaction.guild, interaction.user);
            if (channel) {
                await interaction.editReply({ content: `🤖 Il tuo canale AI personale è pronto: ${channel}` });
            } else {
                await interaction.editReply({ content: "Hai già un canale AI attivo. Cercalo nella categoria AI Sessions!" });
            }
        } catch (err) {
            console.error("Errore in comando /ai:", err);
            await interaction.editReply("⚠ Errore durante la creazione del canale AI. Contatta lo staff.");
        }
    },
};
