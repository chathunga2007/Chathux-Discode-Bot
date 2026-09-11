const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cat')
        .setDescription('Fetches a cute random cat picture.'),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const res = await axios.get('https://api.thecatapi.com/v1/images/search', { timeout: 8000 });
            const imageUrl = res.data?.[0]?.url;

            const embed = new EmbedBuilder()
                .setColor(config.bot.colors.primary)
                .setTitle('🐱 Meow!')
                .setImage(imageUrl)
                .setFooter({ text: 'Powered by TheCatAPI' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply({ content: '🐱 *Meow!* Could not fetch an image right now, but cats still rule!' });
        }
    }
};
