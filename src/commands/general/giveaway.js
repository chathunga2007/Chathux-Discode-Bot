const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');
const giveawayService = require('../../services/giveawayService');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Create and manage community giveaways with interactive buttons.')
        .addSubcommand(sub =>
            sub.setName('start')
                .setDescription('Start a new interactive giveaway')
                .addStringOption(opt =>
                    opt.setName('prize')
                        .setDescription('What prize are you giving away?')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('duration')
                        .setDescription('Giveaway duration (e.g., 30s, 10m, 1h, 1d)')
                        .setRequired(true)
                )
                .addIntegerOption(opt =>
                    opt.setName('winners')
                        .setDescription('Number of winners to pick (default: 1)')
                        .setMinValue(1)
                        .setMaxValue(20)
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('end')
                .setDescription('End an active giveaway early and pick winners immediately')
                .addStringOption(opt =>
                    opt.setName('message_id')
                        .setDescription('Message ID of the giveaway to end')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('reroll')
                .setDescription('Reroll a new winner from an ended giveaway')
                .addStringOption(opt =>
                    opt.setName('message_id')
                        .setDescription('Message ID of the concluded giveaway')
                        .setRequired(true)
                )
        ),

    async execute(interaction, client) {
        // Staff check: user must have ManageGuild or ManageMessages or Administrator
        const member = interaction.member;
        const hasPerm = member.permissions.has(PermissionFlagsBits.ManageGuild) ||
                        member.permissions.has(PermissionFlagsBits.ManageMessages) ||
                        member.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasPerm) {
            return interaction.reply({
                embeds: [createErrorEmbed('Permission Denied', 'You need `Manage Server` or `Manage Messages` permission to manage giveaways.')],
                flags: MessageFlags.Ephemeral
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'start') {
            const prize = interaction.options.getString('prize');
            const durationStr = interaction.options.getString('duration');
            const winners = interaction.options.getInteger('winners') || 1;

            const durationMs = giveawayService.parseDuration(durationStr);
            if (!durationMs || durationMs < 5000) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Invalid Duration', 'Please provide a valid duration such as `30s`, `10m`, `2h`, or `1d` (minimum 5 seconds).')],
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const message = await giveawayService.startGiveaway({
                client,
                channel: interaction.channel,
                host: interaction.user,
                prize,
                durationMs,
                winnerCount: winners
            });

            return interaction.editReply({
                embeds: [createSuccessEmbed('Giveaway Launched!', `Your giveaway for **${prize}** has been posted in this channel! [Jump to Giveaway](${message.url})`)]
            });
        }

        if (subcommand === 'end') {
            const messageId = interaction.options.getString('message_id').trim();
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const result = await giveawayService.endGiveaway(client, messageId);
            if (!result) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Failed to End Giveaway', 'Could not find an active giveaway with that Message ID.')]
                });
            }

            return interaction.editReply({
                embeds: [createSuccessEmbed('Giveaway Concluded', `Successfully ended the giveaway for **${result.prize}**!`)]
            });
        }

        if (subcommand === 'reroll') {
            const messageId = interaction.options.getString('message_id').trim();
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const result = await giveawayService.rerollGiveaway(client, messageId);
            if (!result.success) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Reroll Failed', result.reason)]
                });
            }

            return interaction.editReply({
                embeds: [createSuccessEmbed('Winner Rerolled!', `New winner for **${result.prize}** is <@${result.winner}>!`)]
            });
        }
    }
};
