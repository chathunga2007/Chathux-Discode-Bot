const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const modRepo = require('../../database/repositories/moderationRepository');
const moderationService = require('../../services/moderationService');
const { canModerate } = require('../../utils/permissions');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Issues an official infraction warning to a member.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The member to warn')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const guild = interaction.guild;

        const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
        if (targetMember && !canModerate(interaction.member, targetMember, guild)) {
            return interaction.reply({
                embeds: [createErrorEmbed('Hierarchy Error', 'You cannot warn a member with a higher or equal role.')],
                ephemeral: true
            });
        }

        await modRepo.addWarning(guild.id, targetUser.id, interaction.user.id, reason);
        const allWarnings = await modRepo.getWarnings(guild.id, targetUser.id);

        await moderationService.logModerationAction({
            guild,
            user: targetUser,
            moderator: interaction.user,
            action: 'WARN',
            reason: `${reason} (Warning #${allWarnings.length})`
        });

        // Notify member in DM
        if (targetMember) {
            targetMember.send(`⚠️ You received an official warning in **${guild.name}**:\n*${reason}* (Total warnings: ${allWarnings.length})`).catch(() => {});
        }

        await interaction.reply({
            embeds: [createSuccessEmbed(
                'Warning Issued',
                `Successfully warned **${targetUser.tag}**.\n**Reason**: ${reason}\n**Total Infractions**: \`${allWarnings.length}\``
            )]
        });
    }
};
