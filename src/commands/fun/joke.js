const { SlashCommandBuilder } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embeds');

const JOKES = [
    { q: 'Why do programmers prefer dark mode?', a: 'Because light attracts bugs! 🐛' },
    { q: 'Why do Java developers wear glasses?', a: 'Because they don\'t C#! 👓' },
    { q: 'A SQL query walks into a bar, walks up to two tables and asks...', a: '"Can I join you?" 🍻' },
    { q: 'How many programmers does it take to change a light bulb?', a: 'None, that\'s a hardware problem! 💡' },
    { q: 'Why was the JavaScript developer sad?', a: 'Because they didn\'t Node how to Express themselves! 😢' },
    { q: 'Real programmer counting:', a: '0, 1, 2, 3, 4...' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joke')
        .setDescription('Tell a hilarious programmer or general joke.'),
    async execute(interaction) {
        const item = JOKES[Math.floor(Math.random() * JOKES.length)];
        const embed = createInfoEmbed(
            '😂 Random Joke',
            `**${item.q}**\n\n> *${item.a}*`
        );
        await interaction.reply({ embeds: [embed] });
    }
};
