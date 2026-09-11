const { SlashCommandBuilder } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embeds');

const RESPONSES = [
    'It is certain.', 'Without a doubt.', 'You may rely on it.', 'Yes, definitely.',
    'As I see it, yes.', 'Most likely.', 'Outlook good.', 'Yes.',
    'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.', 'Cannot predict now.',
    'Don\'t count on it.', 'My reply is no.', 'My sources say no.', 'Outlook not so good.', 'Very doubtful.'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Consult the magic 8-ball for answers to life\'s queries.')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The question you wish to ask')
                .setRequired(true)
        ),
    async execute(interaction) {
        const question = interaction.options.getString('question');
        const answer = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];

        const embed = createInfoEmbed(
            '🎱 Magic 8-Ball',
            `**Question**: *${question}*\n\n**Prediction**: 🔮 **${answer}**`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
