const { SlashCommandBuilder } = require('discord.js');
const aiService = require('../../services/aiService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('explain')
        .setDescription('Provide an in-depth breakdown and architectural explanation of a code snippet.')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('The code snippet or logic to explain')
                .setRequired(true)
        ),
    async execute(interaction) {
        const code = interaction.options.getString('code');
        await interaction.deferReply();

        const prompt = `Please analyze and explain what this code does, its complexity, and any edge cases:\n\`\`\`\n${code}\n\`\`\``;
        const systemInstruction = 'You are a senior code reviewer. Explain the code clearly, breaking it down into purpose, flow, time complexity, and optimization suggestions.';

        const response = await aiService.generateResponse({
            prompt,
            userId: interaction.user.id,
            guildId: interaction.guild?.id || null,
            channelId: interaction.channelId,
            systemInstruction
        });

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
