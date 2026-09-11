const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const moderationService = require('../../services/moderationService');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Locks the current channel to prevent members from sending messages.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for locking the channel')
                .setRequired(false)
        ),
    async execute(interaction) {
        const channel = interaction.channel;
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const everyoneRole = interaction.guild.roles.everyone;

        try {
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false
            }, { reason: `Locked by ${interaction.user.tag}: ${reason}` });

            await moderationService.logModerationAction({
                guild: interaction.guild,
                user: interaction.user,
                moderator: interaction.user,
                action: 'CHANNEL_LOCK',
                reason: `Locked #${channel.name} (${reason})`
            });

            await interaction.reply({
                embeds: [createSuccessEmbed('🔒 Channel Locked', `This channel has been locked.\n**Reason**: ${reason}`)]
            });
        } catch (err) {
            await interaction.reply({
                embeds: [createErrorEmbed('Lock Failed', `Could not lock channel: ${err.message}`)],
                ephemeral: true
            });
        }
    }
};
