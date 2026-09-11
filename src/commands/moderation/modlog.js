const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const modRepo = require('../../database/repositories/moderationRepository');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modlog')
        .setDescription('Displays recent moderation actions taken in this server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of logs to retrieve (5 to 25)')
                .setMinValue(5)
                .setMaxValue(25)
                .setRequired(false)
        ),
    async execute(interaction) {
        const limit = interaction.options.getInteger('limit') || 10;
        const logs = await modRepo.getLogs(interaction.guild.id, limit);

        if (logs.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.bot.colors.info)
                .setTitle('🛡️ Moderation Audit Logs')
                .setDescription('No moderation actions recorded in the database for this server yet.')
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }

        const logList = logs.map((entry, idx) => {
            const timeStr = entry.created_at ? `<t:${Math.floor(new Date(entry.created_at).getTime() / 1000)}:R>` : 'Recently';
            return `**${idx + 1}. [${entry.action}]** Target: <@${entry.user_id}> | Mod: <@${entry.moderator_id}> (${timeStr})\n> Reason: *${entry.reason || 'None'}*`;
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle(`🛡️ Recent Moderation Logs (${logs.length})`)
            .setDescription(logList.slice(0, 4000))
            .setFooter({ text: 'ChathuX Security Audit' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
