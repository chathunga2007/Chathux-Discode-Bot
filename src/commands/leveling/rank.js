const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const xpService = require('../../services/xpService');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Displays your level card, XP progress bar, and server rank.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The member whose rank you want to inspect')
                .setRequired(false)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const details = await xpService.getRankDetails(interaction.guild.id, targetUser);

        const cardText = `\`\`\`
╭──────────────────────────────────────────╮
│ 🏆 ${targetUser.username.padEnd(24)} Rank #${String(details.rank).padEnd(6)}│
│ Level: ${String(details.level).padEnd(34)}│
│ XP: ${details.currentXp.toLocaleString()} / ${details.requiredXp.toLocaleString().padEnd(25)}│
│ ${details.progressBar.padEnd(41)}│
╰──────────────────────────────────────────╯
\`\`\``;

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle(`🏆 Level & Rank Profile: ${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .setDescription(cardText)
            .addFields(
                { name: 'Total XP Earned', value: `\`${details.totalXp.toLocaleString()} XP\``, inline: true },
                { name: 'Global Server Rank', value: `\`#${details.rank}\``, inline: true },
                { name: 'Current Level', value: `\`Level ${details.level}\``, inline: true }
            )
            .setFooter({ text: 'Keep chatting to earn more XP and climb the leaderboard!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
