const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const musicService = require('../../services/musicService');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Displays the upcoming tracks in the music queue.'),
    async execute(interaction) {
        const queue = musicService.getQueue(interaction.guild.id);

        if (!queue.currentTrack && queue.tracks.length === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor(config.bot.colors.info).setDescription('The music queue is currently empty.')],
                ephemeral: true
            });
        }

        const current = queue.currentTrack ? `▶️ **Now Playing**: **[${queue.currentTrack.title}](${queue.currentTrack.url})**\n\n` : '';
        const upcoming = queue.tracks.length > 0
            ? queue.tracks.slice(0, 10).map((t, i) => `\`${i + 1}.\` **[${t.title}](${t.url})** (${t.duration}) - Requested by *${t.requester}*`).join('\n')
            : '*No upcoming tracks in queue.*';

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle(`🎶 Music Queue (${queue.tracks.length} upcoming)`)
            .setDescription(`${current}__Upcoming Tracks:__\n${upcoming}`)
            .setFooter({ text: `Loop Mode: ${queue.loopMode.toUpperCase()} | Volume: ${queue.volume}%` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
