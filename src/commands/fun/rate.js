const { SlashCommandBuilder } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rate')
        .setDescription('Rates anything on a scale of 0 to 10.')
        .addStringOption(option =>
            option.setName('subject')
                .setDescription('The thing, person, or idea to rate')
                .setRequired(true)
        ),
    async execute(interaction) {
        const subject = interaction.options.getString('subject');
        const score = Math.floor(Math.random() * 11);

        const stars = '⭐'.repeat(score) + '☆'.repeat(10 - score);

        const embed = createInfoEmbed(
            '🌟 ChathuX Rating Machine',
            `**Subject**: *${subject}*\n\n**Rating**: **${score}/10**\n${stars}`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
