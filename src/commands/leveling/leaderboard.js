const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const xpRepo = require('../../database/repositories/xpRepository');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Displays the top 10 most active members on the server.'),
    async execute(interaction) {
        const topMembers = await xpRepo.getLeaderboard(interaction.guild.id, 10);

        if (topMembers.length === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor(config.bot.colors.info).setDescription('No XP recorded yet. Start chatting to be #1!')]
            });
        }

        const medals = ['🥇', '🥈', '🥉'];
        const list = topMembers.map((entry, index) => {
            const prefix = medals[index] || `**#${index + 1}**`;
            return `${prefix} <@${entry.user_id}> — **Level ${entry.level}** (\`${entry.xp.toLocaleString()} XP\`)`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle(`🏆 ${interaction.guild.name} XP Leaderboard`)
            .setDescription(list)
            .setFooter({ text: 'Ranks are updated dynamically after each message' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
