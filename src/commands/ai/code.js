const { SlashCommandBuilder } = require('discord.js');
const aiService = require('../../services/aiService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('code')
        .setDescription('Generate high-quality code, algorithms, or script solutions.')
        .addStringOption(option =>
            option.setName('problem')
                .setDescription('The programming problem or function specification')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('language')
                .setDescription('Target programming language (e.g. JavaScript, Python, C++)')
                .setRequired(false)
        ),
    async execute(interaction) {
        const problem = interaction.options.getString('problem');
        const language = interaction.options.getString('language') || 'JavaScript';

        await interaction.deferReply();

        const prompt = `Please write clean, well-tested code in ${language} to solve this: ${problem}`;
        const systemInstruction = `You are a staff software architect. Output clean, optimal ${language} code enclosed in markdown code blocks with clear commentary.`;

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
