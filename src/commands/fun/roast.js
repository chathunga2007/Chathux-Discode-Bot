const { SlashCommandBuilder } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embeds');

const ROASTS = [
    'You are like a cloud. When you disappear, it\'s a beautiful day.',
    'I would explain it to you, but I left my English-to-Dumbass dictionary at home.',
    'You have the right to remain silent, but clearly you lack the ability.',
    'I\'d agree with you, but then we\'d both be wrong.',
    'You bring everyone so much joy... when you leave the room.',
    'If laughter is the best medicine, your face must be curing the world.',
    'You are proof that even evolution takes a coffee break.'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roast')
        .setDescription('Deliver a playful and witty roast to someone.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to roast')
                .setRequired(false)
        ),
    async execute(interaction) {
        const target = interaction.options.getUser('user') || interaction.user;
        const roast = ROASTS[Math.floor(Math.random() * ROASTS.length)];

        const embed = createInfoEmbed(
            '🔥 Savage Roast',
            `<@${target.id}>, ${roast}`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
