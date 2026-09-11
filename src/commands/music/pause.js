const { SlashCommandBuilder } = require('discord.js');
const musicService = require('../../services/musicService');
const { createSuccessEmbed, createWarningEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses the currently playing track.'),
    async execute(interaction) {
        const success = musicService.pause(interaction.guild.id);

        if (!success) {
            return interaction.reply({
                embeds: [createWarningEmbed('Cannot Pause', 'There is no track actively playing to pause.')],
                ephemeral: true
            });
        }

        await interaction.reply({
            embeds: [createSuccessEmbed('Playback Paused', 'Audio has been paused. Use `/resume` to continue listening.')]
        });
    }
};
