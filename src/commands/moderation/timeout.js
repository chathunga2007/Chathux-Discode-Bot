const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const moderationService = require('../../services/moderationService');
const { canModerate, botCanModerate } = require('../../utils/permissions');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Temporarily isolates a member from text and voice communication.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The member to timeout')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes (1 to 40320 - max 28 days)')
                .setMinValue(1)
                .setMaxValue(40320)
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const durationMinutes = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const guild = interaction.guild;

        const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({
                embeds: [createErrorEmbed('User Not Found', 'This user is not currently in the server.')],
                ephemeral: true
            });
        }

        if (!canModerate(interaction.member, targetMember, guild)) {
            return interaction.reply({
                embeds: [createErrorEmbed('Hierarchy Error', 'You cannot timeout a member with a higher or equal role.')],
                ephemeral: true
            });
        }

        if (!botCanModerate(guild.members.me, targetMember, guild)) {
            return interaction.reply({
                embeds: [createErrorEmbed('Bot Hierarchy Error', 'My role is not high enough to timeout this member.')],
                ephemeral: true
            });
        }

        try {
            const ms = durationMinutes * 60 * 1000;
            await targetMember.timeout(ms, `${reason} | Timeout by ${interaction.user.tag}`);

            await moderationService.logModerationAction({
                guild,
                user: targetUser,
                moderator: interaction.user,
                action: 'TIMEOUT',
                reason,
                duration: durationMinutes * 60
            });

            await interaction.reply({
                embeds: [createSuccessEmbed('Member Timed Out', `Successfully put **${targetUser.tag}** in timeout for **${durationMinutes} minute(s)**.\n**Reason**: ${reason}`)]
            });
        } catch (err) {
            await interaction.reply({
                embeds: [createErrorEmbed('Timeout Failed', `Could not apply timeout: ${err.message}`)],
                ephemeral: true
            });
        }
    }
};
