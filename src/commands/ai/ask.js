const { SlashCommandBuilder } = require('discord.js');
const aiService = require('../../services/aiService');
const guildRepo = require('../../database/repositories/guildRepository');
const { createWarningEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask the ChathuX AI Assistant anything with persistent context memory.')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The question or query for the AI')
                .setRequired(true)
        ),
    async execute(interaction) {
        if (interaction.guild) {
            const settings = await guildRepo.getSettings(interaction.guild.id);
            if (!settings.ai_enabled) {
                return interaction.reply({
                    embeds: [createWarningEmbed('AI Disabled', 'The AI Assistant module is currently disabled on this server.')],
                    ephemeral: true
                });
            }
        }

        const question = interaction.options.getString('question');

        // Defer reply for thinking indicator
        await interaction.deferReply();

        const response = await aiService.generateResponse({
            prompt: question,
            userId: interaction.user.id,
            guildId: interaction.guild?.id || null,
            channelId: interaction.channelId
        });

        // Split response if exceeding Discord 2000 char message limit
        if (response.length <= 2000) {
            await interaction.editReply({ content: response });
        } else {
            const chunks = response.match(/[\s\S]{1,1900}/g) || [response];
            await interaction.editReply({ content: chunks[0] });
            for (let i = 1; i < chunks.length; i++) {
                await interaction.followUp({ content: chunks[i] });
            }
        }
    }
};
