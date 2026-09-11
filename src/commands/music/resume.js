const { SlashCommandBuilder } = require('discord.js');
const musicService = require('../../services/musicService');
const { createSuccessEmbed, createWarningEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resumes previously paused audio playback.'),
    async execute(interaction) {
        const success = musicService.resume(interaction.guild.id);

        if (!success) {
            return interaction.reply({
                embeds: [createWarningEmbed('Cannot Resume', 'Playback is not paused or there is no active track.')],
                ephemeral: true
            });
        }

        await interaction.reply({
            embeds: [createSuccessEmbed('Playback Resumed', 'Audio stream resumed!')]
        });
    }
};
