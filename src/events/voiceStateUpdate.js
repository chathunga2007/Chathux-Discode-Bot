const musicService = require('../services/musicService');
const { createInfoEmbed } = require('../utils/embeds');
const logger = require('../utils/logger');

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState, client) {
        try {
            const guild = oldState.guild || newState.guild;
            if (!guild) return;

            // 1. If the bot itself was disconnected or moved
            if (oldState.id === client.user.id) {
                if (!newState.channelId) {
                    logger.info(`Bot was disconnected from voice in guild ${guild.id}`, 'MUSIC');
                    musicService.stop(guild.id);
                    musicService.destroyQueue(guild.id);
                }
                return;
            }

            // 2. Check if a user left the voice channel where the bot is active
            const botMember = guild.members.me || guild.members.cache.get(client.user.id);
            if (!botMember || !botMember.voice.channelId) return;

            const botVoiceChannelId = botMember.voice.channelId;

            // Only act if the left channel is the bot's current channel
            if (oldState.channelId === botVoiceChannelId && newState.channelId !== botVoiceChannelId) {
                const voiceChannel = oldState.channel;
                if (!voiceChannel) return;

                // Count human (non-bot) members remaining in the channel
                const remainingHumans = voiceChannel.members.filter(member => !member.user.bot);

                if (remainingHumans.size === 0) {
                    logger.info(`All members left voice channel in guild ${guild.id}. Auto-disconnecting bot...`, 'MUSIC');

                    const queue = musicService.getQueue(guild.id);
                    if (queue && queue.textChannel) {
                        const embed = createInfoEmbed(
                            '👋 Auto Disconnected',
                            'Everyone left the voice channel! Playback has stopped and ChathuX has disconnected.'
                        );
                        queue.textChannel.send({ embeds: [embed] }).catch(() => {});
                    }

                    musicService.stop(guild.id);
                    musicService.destroyQueue(guild.id);
                }
            }
        } catch (error) {
            logger.error('Error handling voiceStateUpdate event', error, 'VOICE_EVENT');
        }
    }
};
