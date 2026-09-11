const { SlashCommandBuilder } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Rolls a random die with custom sides (default: 6).')
        .addIntegerOption(option =>
            option.setName('sides')
                .setDescription('Number of sides on the die (2 to 100)')
                .setMinValue(2)
                .setMaxValue(100)
                .setRequired(false)
        ),
    async execute(interaction) {
        const sides = interaction.options.getInteger('sides') || 6;
        const roll = Math.floor(Math.random() * sides) + 1;

        const embed = createInfoEmbed(
            '🎲 Dice Roll',
            `You rolled a **d${sides}** and got: 🎯 **${roll}**`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
