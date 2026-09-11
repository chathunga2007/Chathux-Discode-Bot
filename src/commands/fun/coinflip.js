const { SlashCommandBuilder } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flips a coin to land on Heads or Tails.'),
    async execute(interaction) {
        const isHeads = Math.random() < 0.5;
        const result = isHeads ? 'Heads' : 'Tails';
        const icon = isHeads ? '🪙' : '🪙';

        const embed = createInfoEmbed(
            '🪙 Coin Toss',
            `The coin landed on: **${result}**!`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
