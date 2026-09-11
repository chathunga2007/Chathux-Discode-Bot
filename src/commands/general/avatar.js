const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Fetches and displays high-resolution avatar of a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose avatar you want to view')
                .setRequired(false)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle(`🖼️ Avatar of ${user.username}`)
            .setImage(avatarUrl)
            .setDescription(`[Click to Open in Full Size](${avatarUrl})`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
