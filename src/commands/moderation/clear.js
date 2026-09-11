const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const moderationService = require('../../services/moderationService');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Bulk deletes recent messages in the current channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1 to 100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
        ),
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const channel = interaction.channel;

        if (!channel.isTextBased()) {
            return interaction.reply({
                embeds: [createErrorEmbed('Invalid Channel', 'Messages can only be cleared from text channels.')],
                ephemeral: true
            });
        }

        try {
            const deleted = await channel.bulkDelete(amount, true);

            await moderationService.logModerationAction({
                guild: interaction.guild,
                user: interaction.user,
                moderator: interaction.user,
                action: 'CLEAR_MESSAGES',
                reason: `Bulk deleted ${deleted.size} messages in #${channel.name}`
            });

            await interaction.reply({
                embeds: [createSuccessEmbed('Purged Messages', `Successfully removed **${deleted.size}** messages from this channel.`)],
                ephemeral: true
            });
        } catch (err) {
            await interaction.reply({
                embeds: [createErrorEmbed('Purge Failed', `Could not delete messages (Discord prevents deleting messages older than 14 days): ${err.message}`)],
                ephemeral: true
            });
        }
    }
};
