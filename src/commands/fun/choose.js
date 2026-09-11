const { SlashCommandBuilder } = require('discord.js');
const { createInfoEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('choose')
        .setDescription('Can\'t decide? Let ChathuX pick from a comma-separated list of options.')
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Comma-separated choices (e.g. Pizza, Burger, Tacos)')
                .setRequired(true)
        ),
    async execute(interaction) {
        const rawOptions = interaction.options.getString('options');
        const choices = rawOptions.split(',').map(s => s.trim()).filter(s => s.length > 0);

        if (choices.length < 2) {
            return interaction.reply({
                embeds: [createErrorEmbed('Invalid Choices', 'Please provide at least two choices separated by commas.')],
                ephemeral: true
            });
        }

        const picked = choices[Math.floor(Math.random() * choices.length)];

        const embed = createInfoEmbed(
            '🎯 The Choice is Made!',
            `Between: *${choices.join('*, *')}*\n\n👉 **${picked}** is the winner!`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
