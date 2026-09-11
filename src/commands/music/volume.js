const { SlashCommandBuilder } = require('discord.js');
const musicService = require('../../services/musicService');
const { createSuccessEmbed, createWarningEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Adjusts the player volume level.')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (0 to 100)')
                .setMinValue(0)
                .setMaxValue(100)
                .setRequired(true)
        ),
    async execute(interaction) {
        const level = interaction.options.getInteger('level');
        const queue = musicService.getQueue(interaction.guild.id);

        if (!queue) {
            return interaction.reply({
                embeds: [createWarningEmbed('No Music', 'The music player is not currently active.')],
                ephemeral: true
            });
        }

        musicService.setVolume(interaction.guild.id, level);

        await interaction.reply({
            embeds: [createSuccessEmbed('Volume Adjusted', `Music playback volume set to **${level}%**.`)]
        });
    }
};
