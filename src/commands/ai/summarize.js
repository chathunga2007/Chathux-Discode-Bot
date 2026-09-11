const { SlashCommandBuilder } = require('discord.js');
const aiService = require('../../services/aiService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summarize')
        .setDescription('Condense lengthy text, articles, or notes into key bullet points.')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('The long text or message you want to summarize')
                .setRequired(true)
        ),
    async execute(interaction) {
        const text = interaction.options.getString('text');

        await interaction.deferReply();

        const prompt = `Summarize the following text into key bullet points with high-impact conclusions:\n${text}`;
        const systemInstruction = 'You are an executive briefing specialist. Deliver concise, high-yield bullet point summaries without fluff.';

        const response = await aiService.generateResponse({
            prompt,
            userId: interaction.user.id,
            guildId: interaction.guild?.id || null,
            channelId: interaction.channelId,
            systemInstruction
        });

        await interaction.editReply({ content: response });
    }
};
