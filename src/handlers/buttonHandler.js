const { MessageFlags } = require('discord.js');
const musicService = require('../services/musicService');
const { createInfoEmbed, createWarningEmbed } = require('../utils/embeds');
const logger = require('../utils/logger');

async function handleButtonInteraction(interaction) {
    const { customId, guild, member } = interaction;
    if (!guild) return;

    // Music Player Controls
    if (customId.startsWith('music_')) {
        if (!member.voice.channel) {
            return interaction.reply({
                embeds: [createWarningEmbed('Voice Required', 'You must be in a voice channel to control playback!')],
                flags: MessageFlags.Ephemeral
            }).catch(() => {});
        }

        const queue = musicService.getQueue(guild.id);
        if (!queue || !queue.currentTrack) {
            return interaction.reply({
                embeds: [createWarningEmbed('No Music', 'There is no music currently active to control.')],
                flags: MessageFlags.Ephemeral
            }).catch(() => {});
        }

        switch (customId) {
            case 'music_pause_resume':
                if (queue.isPaused) {
                    musicService.resume(guild.id);
                    return interaction.reply({ content: '▶️ Resumed music playback!', flags: MessageFlags.Ephemeral }).catch(() => {});
                } else {
                    musicService.pause(guild.id);
                    return interaction.reply({ content: '⏸️ Paused music playback!', flags: MessageFlags.Ephemeral }).catch(() => {});
                }

            case 'music_skip': {
                const skipped = musicService.skip(guild.id);
                return interaction.reply({
                    content: skipped ? `⏭️ Skipped **${skipped.title}**` : '⏭️ Skipped track.',
                    flags: MessageFlags.Ephemeral
                }).catch(() => {});
            }

            case 'music_stop':
                musicService.stop(guild.id);
                return interaction.reply({ content: '⏹️ Stopped music and cleared the queue.', flags: MessageFlags.Ephemeral }).catch(() => {});

            case 'music_loop': {
                const mode = musicService.setLoop(guild.id);
                return interaction.reply({ content: `🔁 Loop mode set to **${mode.toUpperCase()}**`, flags: MessageFlags.Ephemeral }).catch(() => {});
            }

            case 'music_queue': {
                const tracks = queue.tracks;
                if (tracks.length === 0) {
                    return interaction.reply({ content: '📜 The queue has no upcoming songs.', flags: MessageFlags.Ephemeral }).catch(() => {});
                }
                const trackList = tracks.slice(0, 10).map((t, idx) => `${idx + 1}. **${t.title}** (${t.duration || '03:30'})`).join('\n');
                return interaction.reply({
                    embeds: [createInfoEmbed('📜 Upcoming Queue', trackList)],
                    flags: MessageFlags.Ephemeral
                }).catch(() => {});
            }
        }
    }
}

async function handleSelectMenuInteraction(interaction) {
    const { customId, values } = interaction;

    if (customId === 'help_category_select') {
        const selected = values[0];
        const { getCategoryHelpEmbed } = require('../commands/general/help');
        const embed = getCategoryHelpEmbed(selected);
        await interaction.update({ embeds: [embed] });
    }
}

module.exports = {
    handleButtonInteraction,
    handleSelectMenuInteraction
};
