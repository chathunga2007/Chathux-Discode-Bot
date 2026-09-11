const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dog')
        .setDescription('Fetches a friendly random dog photo.'),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const res = await axios.get('https://dog.ceo/api/breeds/image/random', { timeout: 8000 });
            const imageUrl = res.data?.message;

            const embed = new EmbedBuilder()
                .setColor(config.bot.colors.primary)
                .setTitle('🐶 Woof!')
                .setImage(imageUrl)
                .setFooter({ text: 'Powered by Dog CEO API' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply({ content: '🐶 *Woof!* Could not load dog picture right now!' });
        }
    }
};
