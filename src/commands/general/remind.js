const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const reminderService = require('../../services/reminderService');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set an automated timed reminder for yourself.')
        .addStringOption(opt =>
            opt.setName('time')
                .setDescription('Duration before reminder (e.g., 10m, 1h, 30s, 1d)')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('task')
                .setDescription('What do you want to be reminded about?')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const timeStr = interaction.options.getString('time');
        const task = interaction.options.getString('task');

        const durationMs = reminderService.parseDuration(timeStr);
        if (!durationMs || durationMs < 5000) {
            return interaction.reply({
                embeds: [createErrorEmbed('Invalid Duration', 'Please provide a valid time format like `30s`, `10m`, `2h`, or `1d` (minimum 5 seconds).')],
                flags: MessageFlags.Ephemeral
            });
        }

        const { fireTime } = reminderService.scheduleReminder({
            client,
            userId: interaction.user.id,
            channelId: interaction.channel.id,
            task,
            durationMs
        });

        const targetTimestamp = Math.floor(fireTime / 1000);
        const embed = createSuccessEmbed(
            'Reminder Scheduled',
            `⏰ I will remind you: **"${task}"**\n` +
            `🔔 **Scheduled for**: <t:${targetTimestamp}:F> (<t:${targetTimestamp}:R>)`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
