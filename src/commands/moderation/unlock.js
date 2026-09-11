const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const moderationService = require('../../services/moderationService');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Restores normal messaging permissions to the current channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const channel = interaction.channel;
        const everyoneRole = interaction.guild.roles.everyone;

        try {
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: null
            }, { reason: `Unlocked by ${interaction.user.tag}` });

            await moderationService.logModerationAction({
                guild: interaction.guild,
                user: interaction.user,
                moderator: interaction.user,
                action: 'CHANNEL_UNLOCK',
                reason: `Unlocked #${channel.name}`
            });

            await interaction.reply({
                embeds: [createSuccessEmbed('🔓 Channel Unlocked', 'Normal communication permissions have been restored to this channel.')]
            });
        } catch (err) {
            await interaction.reply({
                embeds: [createErrorEmbed('Unlock Failed', `Could not unlock channel: ${err.message}`)],
                ephemeral: true
            });
        }
    }
};
