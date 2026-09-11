const { SlashCommandBuilder } = require('discord.js');
const aiService = require('../../services/aiService');
const { createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ai-clear')
        .setDescription('Reset your active AI conversation session memory for this channel.'),
    async execute(interaction) {
        await aiService.clearMemory(interaction.channelId, interaction.user.id);

        const embed = createSuccessEmbed(
            'AI Memory Cleared',
            'Your previous conversation context with ChathuX AI in this channel has been reset. You can now start a completely fresh discussion!'
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
