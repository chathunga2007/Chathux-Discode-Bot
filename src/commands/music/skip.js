const { SlashCommandBuilder } = require('discord.js');
const musicService = require('../../services/musicService');
const { createSuccessEmbed, createWarningEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song and advances to the next track in the queue.'),
    async execute(interaction) {
        const skipped = musicService.skip(interaction.guild.id);

        if (!skipped) {
            return interaction.reply({
                embeds: [createWarningEmbed('Cannot Skip', 'There is no track currently playing to skip.')],
                ephemeral: true
            });
        }

        await interaction.reply({
            embeds: [createSuccessEmbed('Track Skipped', `Skipped **${skipped.title}**.`)]
        });
    }
};
