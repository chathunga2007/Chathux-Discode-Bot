const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Sets the message cooldown timer for this channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('Cooldown duration in seconds (0 to 21600 - max 6 hours)')
                .setMinValue(0)
                .setMaxValue(21600)
                .setRequired(true)
        ),
    async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        const channel = interaction.channel;

        if (!channel.isTextBased()) {
            return interaction.reply({
                embeds: [createErrorEmbed('Invalid Channel', 'Slowmode can only be applied to text channels.')],
                ephemeral: true
            });
        }

        try {
            await channel.setRateLimitPerUser(seconds);

            const message = seconds === 0
                ? 'Slowmode has been **disabled** for this channel.'
                : `Slowmode is now set to **${seconds} seconds** per message.`;

            await interaction.reply({
                embeds: [createSuccessEmbed('Slowmode Updated', message)]
            });
        } catch (err) {
            await interaction.reply({
                embeds: [createErrorEmbed('Failed', `Could not update slowmode: ${err.message}`)],
                ephemeral: true
            });
        }
    }
};
