const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Fetches a trending meme from Reddit.'),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const subreddits = ['memes', 'dankmemes', 'wholesomememes', 'ProgrammerHumor'];
            const chosenSub = subreddits[Math.floor(Math.random() * subreddits.length)];
            const res = await axios.get(`https://meme-api.com/gimme/${chosenSub}`, { timeout: 8000 });

            const data = res.data;
            const embed = new EmbedBuilder()
                .setColor(config.bot.colors.primary)
                .setTitle(data.title || 'Fresh Meme')
                .setImage(data.url)
                .setFooter({ text: `👍 ${data.ups || 0} upvotes | r/${data.subreddit || chosenSub}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch {
            const fallbackEmbed = new EmbedBuilder()
                .setColor(config.bot.colors.primary)
                .setTitle('😂 Classic Developer Meme')
                .setDescription('**"It works on my machine!"**\nThen we will ship your machine to the customer!')
                .setFooter({ text: 'ChathuX Entertainment' });
            await interaction.editReply({ embeds: [fallbackEmbed] });
        }
    }
};
