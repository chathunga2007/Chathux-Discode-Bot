const { SlashCommandBuilder } = require('discord.js');
const economyService = require('../../services/economyService');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pay')
        .setDescription('Transfer coins securely from your wallet to another member.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The recipient member')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of coins to send')
                .setMinValue(1)
                .setRequired(true)
        ),
    async execute(interaction) {
        const receiver = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        if (receiver.bot) {
            return interaction.reply({
                embeds: [createErrorEmbed('Invalid Recipient', 'You cannot transfer coins to bot accounts.')],
                ephemeral: true
            });
        }

        const result = await economyService.transfer(interaction.guild.id, interaction.user.id, receiver.id, amount);

        if (!result.success) {
            return interaction.reply({
                embeds: [createErrorEmbed('Transfer Failed', result.reason)],
                ephemeral: true
            });
        }

        const embed = createSuccessEmbed(
            'Transfer Complete',
            `You sent **${amount.toLocaleString()} coins** to <@${receiver.id}> successfully!`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
