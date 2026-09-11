const { SlashCommandBuilder } = require('discord.js');
const musicService = require('../../services/musicService');
const { createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops playback, clears the queue, and disconnects the player.'),
    async execute(interaction) {
        musicService.stop(interaction.guild.id);
        await interaction.reply({
            embeds: [createSuccessEmbed('Playback Stopped', 'The music player has been stopped and the queue has been cleared.')]
        });
    }
};
