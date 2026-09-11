const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const xpService = require('../../services/xpService');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('levels')
        .setDescription('Shows the XP milestones and progression requirements.'),
    async execute(interaction) {
        const milestones = [1, 2, 5, 10, 15, 20, 25, 30, 40, 50];
        const lines = milestones.map(lvl => {
            const xpNeeded = xpService.getXPForLevel(lvl);
            return `⭐ **Level ${lvl}**: \`${xpNeeded.toLocaleString()} XP\``;
        });

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle('📈 Level Progression Milestones')
            .setDescription(
                'Earn **15-25 XP** per message (with a 60-second cooldown to prevent spam).\n\n' +
                lines.join('\n')
            )
            .setFooter({ text: 'Admins can configure role rewards for reaching specific levels!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
