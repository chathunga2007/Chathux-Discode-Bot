const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const moderationService = require('../../services/moderationService');
const { canModerate } = require('../../utils/permissions');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Removes timeout restriction from a member early.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The member whose timeout should be lifted')
                .setRequired(true)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
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
                embeds: [createErrorEmbed('Hierarchy Error', 'You cannot moderate this member.')],
                ephemeral: true
            });
        }

        try {
            await targetMember.timeout(null, `Timeout removed by ${interaction.user.tag}`);

            await moderationService.logModerationAction({
                guild,
                user: targetUser,
                moderator: interaction.user,
                action: 'UNTIMEOUT',
                reason: 'Early timeout lift'
            });

            await interaction.reply({
                embeds: [createSuccessEmbed('Timeout Lifted', `Successfully removed timeout for **${targetUser.tag}**.`)]
            });
        } catch (err) {
            await interaction.reply({
                embeds: [createErrorEmbed('Failed', `Could not lift timeout: ${err.message}`)],
                ephemeral: true
            });
        }
    }
};
