const { SlashCommandBuilder } = require('discord.js');
const xpRepo = require('../../database/repositories/xpRepository');
const { createInfoEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Quick check of your current level.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose level you want to check')
                .setRequired(false)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const data = await xpRepo.getUserXP(interaction.guild.id, targetUser.id);
        const rank = await xpRepo.getUserRank(interaction.guild.id, targetUser.id);

        const embed = createInfoEmbed(
            `⭐ Level Status: ${targetUser.username}`,
            `**Current Level**: \`Level ${data.level}\`\n**Rank**: \`#${rank}\`\n**Total XP**: \`${data.xp.toLocaleString()} XP\`\n**Messages Sent**: \`${data.total_messages.toLocaleString()}\``
        );

        await interaction.reply({ embeds: [embed] });
    }
};
