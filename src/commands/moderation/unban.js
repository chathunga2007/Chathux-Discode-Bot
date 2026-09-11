const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const moderationService = require('../../services/moderationService');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Revokes a ban for a user by their Discord ID.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('The Discord ID of the user to unban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the unban')
                .setRequired(false)
        ),
    async execute(interaction) {
        const userId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const guild = interaction.guild;

        try {
            const ban = await guild.bans.fetch(userId).catch(() => null);
            if (!ban) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Not Banned', `No ban found for user ID \`${userId}\`.`)],
                    ephemeral: true
                });
            }

            await guild.members.unban(userId, `${reason} | Unbanned by ${interaction.user.tag}`);

            await moderationService.logModerationAction({
                guild,
                user: ban.user,
                moderator: interaction.user,
                action: 'UNBAN',
                reason
            });

            await interaction.reply({
                embeds: [createSuccessEmbed('User Unbanned', `Successfully lifted ban for **${ban.user.tag}** (\`${userId}\`).`)]
            });
        } catch (err) {
            await interaction.reply({
                embeds: [createErrorEmbed('Unban Failed', `Could not unban user: ${err.message}`)],
                ephemeral: true
            });
        }
    }
};
