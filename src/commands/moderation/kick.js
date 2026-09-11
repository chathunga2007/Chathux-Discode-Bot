const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const moderationService = require('../../services/moderationService');
const { canModerate, botCanModerate } = require('../../utils/permissions');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a member from the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The member to kick')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const guild = interaction.guild;

        const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({
                embeds: [createErrorEmbed('User Not Found', 'This user is not a member of this server.')],
                ephemeral: true
            });
        }

        // Permission & Hierarchy Checks
        if (!canModerate(interaction.member, targetMember, guild)) {
            return interaction.reply({
                embeds: [createErrorEmbed('Hierarchy Error', 'You cannot kick a member with a higher or equal role.')],
                ephemeral: true
            });
        }

        if (!botCanModerate(guild.members.me, targetMember, guild)) {
            return interaction.reply({
                embeds: [createErrorEmbed('Bot Hierarchy Error', 'My highest role is below or equal to this member\'s highest role.')],
                ephemeral: true
            });
        }

        try {
            await targetMember.send(`You have been kicked from **${guild.name}** for: *${reason}*`).catch(() => {});
            await targetMember.kick(reason);

            await moderationService.logModerationAction({
                guild,
                user: targetUser,
                moderator: interaction.user,
                action: 'KICK',
                reason
            });

            await interaction.reply({
                embeds: [createSuccessEmbed('Member Kicked', `Successfully kicked **${targetUser.tag}**.\n**Reason**: ${reason}`)]
            });
        } catch (err) {
            await interaction.reply({
                embeds: [createErrorEmbed('Kick Failed', `Failed to kick member: ${err.message}`)],
                ephemeral: true
            });
        }
    }
};
