const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const moderationService = require('../../services/moderationService');
const { canModerate, botCanModerate } = require('../../utils/permissions');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Permanently bans a member from the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Number of days of message history to delete (0 to 7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteDays = interaction.options.getInteger('days') || 0;
        const guild = interaction.guild;

        const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
        if (targetMember) {
            if (!canModerate(interaction.member, targetMember, guild)) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Hierarchy Error', 'You cannot ban a member with a higher or equal role.')],
                    ephemeral: true
                });
            }

            if (!botCanModerate(guild.members.me, targetMember, guild)) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Bot Hierarchy Error', 'My role is not high enough to ban this member.')],
                    ephemeral: true
                });
            }

            await targetMember.send(`You have been banned from **${guild.name}** for: *${reason}*`).catch(() => {});
        }

        try {
            await guild.members.ban(targetUser.id, {
                reason: `${reason} | Banned by ${interaction.user.tag}`,
                deleteMessageSeconds: deleteDays * 86400
            });

            await moderationService.logModerationAction({
                guild,
                user: targetUser,
                moderator: interaction.user,
                action: 'BAN',
                reason
            });

            await interaction.reply({
                embeds: [createSuccessEmbed('Member Banned', `Successfully banned **${targetUser.tag}**.\n**Reason**: ${reason}`)]
            });
        } catch (err) {
            await interaction.reply({
                embeds: [createErrorEmbed('Ban Failed', `Failed to ban user: ${err.message}`)],
                ephemeral: true
            });
        }
    }
};
