const { SlashCommandBuilder } = require('discord.js');
const aiService = require('../../services/aiService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Translate text into any target language (including Sinhala, Japanese, Spanish, etc).')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('The text you want to translate')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('language')
                .setDescription('The target language (e.g. Sinhala, English, French, Japanese)')
                .setRequired(true)
        ),
    async execute(interaction) {
        const text = interaction.options.getString('text');
        const language = interaction.options.getString('language');

        await interaction.deferReply();

        const prompt = `Translate the following text into ${language}. Provide the direct translation followed by pronunciation or context if helpful:\n"${text}"`;
        const systemInstruction = `You are an expert multilingual linguist. Translate accurately and idiomatically into ${language}.`;

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
