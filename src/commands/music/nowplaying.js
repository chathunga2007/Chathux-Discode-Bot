const { SlashCommandBuilder } = require('discord.js');
const musicService = require('../../services/musicService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Displays information and control buttons for the track currently playing.'),
    async execute(interaction) {
        const queue = musicService.getQueue(interaction.guild.id);
        if (!queue || !queue.currentTrack) {
            return interaction.reply({
                content: 'There is nothing currently playing in this server.',
                ephemeral: true
            });
        }

        const embed = musicService.createNowPlayingEmbed(interaction.guild.id);
        const row = musicService.createControlButtons();

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};
