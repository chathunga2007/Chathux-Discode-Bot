const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState
} = require('@discordjs/voice');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const play = require('play-dl');
const { config } = require('../config/config');
const logger = require('../utils/logger');

class MusicService {
    constructor() {
        this.queues = new Map(); // guildId -> GuildQueue
        this.isPlayDlReady = false;
    }

    /**
     * Lazily ensures SoundCloud client credentials for stream extraction
     */
    async ensureClientInit() {
        if (this.isPlayDlReady) return;
        try {
            const clientId = await play.getFreeClientID();
            if (clientId) {
                await play.setToken({ soundcloud: { client_id: clientId } });
                logger.info('SoundCloud client token initialized for audio streaming', 'MUSIC');
            }
            this.isPlayDlReady = true;
        } catch (err) {
            logger.warn(`Could not set soundcloud client token: ${err.message}`, 'MUSIC');
        }
    }

    /**
     * Retrieves or initializes a guild's music queue
     */
    getQueue(guildId) {
        let queue = this.queues.get(guildId);
        if (!queue) {
            queue = {
                guildId,
                voiceChannel: null,
                textChannel: null,
                connection: null,
                player: createAudioPlayer(),
                tracks: [],
                currentTrack: null,
                isPlaying: false,
                isPaused: false,
                volume: 100,
                loopMode: 'off' // 'off' | 'song' | 'queue'
            };

            // Audio Player Event Listeners
            queue.player.on('stateChange', (oldState, newState) => {
                logger.debug(`AudioPlayer state in guild ${guildId}: ${oldState.status} -> ${newState.status}`, 'MUSIC');
            });

            queue.player.on(AudioPlayerStatus.Idle, () => {
                if (queue.isPlaying) {
                    this.handleTrackEnd(guildId);
                }
            });

            queue.player.on('error', (error) => {
                logger.error(`Audio player error in guild ${guildId}: ${error.message}`, error, 'MUSIC');
                if (queue.isPlaying) {
                    this.handleTrackEnd(guildId);
                }
            });

            this.queues.set(guildId, queue);
        }
        return queue;
    }

    /**
     * Ensures sodium WASM is fully initialized before voice handshake
     */
    async ensureSodiumReady() {
        try {
            const sodium = require('libsodium-wrappers');
            await sodium.ready;
        } catch {}
    }

    /**
     * Connects bot to a voice channel
     */
    async connect(voiceChannel, textChannel) {
        const queue = this.getQueue(voiceChannel.guild.id);
        queue.voiceChannel = voiceChannel;
        queue.textChannel = textChannel;

        await this.ensureSodiumReady();

        if (!queue.connection || queue.connection.state.status === VoiceConnectionStatus.Destroyed) {
            queue.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false
            });

            queue.connection.on('stateChange', (oldState, newState) => {
                logger.debug(`VoiceConnection state for guild ${voiceChannel.guild.id}: ${oldState.status} -> ${newState.status}`, 'VOICE');
            });

            try {
                await entersState(queue.connection, VoiceConnectionStatus.Ready, 30_000);
            } catch (err) {
                logger.error(`Voice connection failed to reach Ready state: ${err.message}`, 'MUSIC');
                this.destroyQueue(voiceChannel.guild.id);
                throw new Error('Voice connection timed out while establishing connection to Discord.');
            }

            queue.connection.subscribe(queue.player);

            queue.connection.on(VoiceConnectionStatus.Disconnected, async () => {
                try {
                    await Promise.race([
                        entersState(queue.connection, VoiceConnectionStatus.Signalling, 5000),
                        entersState(queue.connection, VoiceConnectionStatus.Connecting, 5000)
                    ]);
                } catch {
                    this.destroyQueue(voiceChannel.guild.id);
                }
            });
        } else if (queue.connection.state.status !== VoiceConnectionStatus.Ready) {
            await entersState(queue.connection, VoiceConnectionStatus.Ready, 15_000).catch(() => {});
        }

        return queue;
    }

    /**
     * Adds a track to the guild queue
     */
    async enqueue(voiceChannel, textChannel, track) {
        const queue = await this.connect(voiceChannel, textChannel);

        if (queue.idleTimeout) {
            clearTimeout(queue.idleTimeout);
            queue.idleTimeout = null;
        }

        queue.tracks.push(track);

        if (!queue.isPlaying && !queue.currentTrack) {
            await this.playNext(voiceChannel.guild.id);
            return { added: false, playingNow: track };
        }

        return { added: true, track, position: queue.tracks.length };
    }

    /**
     * Plays the next track in the queue
     */
    async playNext(guildId) {
        const queue = this.queues.get(guildId);
        if (!queue) return;

        if (queue.idleTimeout) {
            clearTimeout(queue.idleTimeout);
            queue.idleTimeout = null;
        }

        if (queue.tracks.length === 0) {
            queue.currentTrack = null;
            queue.isPlaying = false;
            if (queue.textChannel) {
                const embed = new EmbedBuilder()
                    .setColor(config.bot.colors.info)
                    .setTitle('🎵 Queue Ended')
                    .setDescription('Playback has completed. ChathuX will automatically disconnect in 2 minutes if no new songs are queued.');
                queue.textChannel.send({ embeds: [embed] }).catch(() => {});
            }

            queue.idleTimeout = setTimeout(() => {
                const current = this.queues.get(guildId);
                if (current && !current.isPlaying && current.tracks.length === 0) {
                    if (current.textChannel) {
                        const embed = new EmbedBuilder()
                            .setColor(config.bot.colors.info)
                            .setTitle('👋 Inactivity Disconnect')
                            .setDescription('Disconnected from voice channel due to inactivity.');
                        current.textChannel.send({ embeds: [embed] }).catch(() => {});
                    }
                    this.stop(guildId);
                    this.destroyQueue(guildId);
                }
            }, 120_000);
            return;
        }

        const track = queue.tracks.shift();
        queue.currentTrack = track;
        queue.isPlaying = true;
        queue.isPaused = false;

        try {
            await this.ensureClientInit();

            let stream = null;
            if (track.streamUrl) {
                stream = await play.stream(track.streamUrl);
            } else if (track.url && (track.url.includes('soundcloud.com') || track.url.includes('api.soundcloud.com'))) {
                stream = await play.stream(track.url);
            } else if (track.url && (track.url.startsWith('http://') || track.url.startsWith('https://'))) {
                try {
                    stream = await play.stream(track.url);
                } catch {
                    // Fall back to direct url resource
                }
            }

            let resource = null;
            if (stream && stream.stream) {
                resource = createAudioResource(stream.stream, {
                    inputType: stream.type,
                    inlineVolume: true
                });
            } else if (track.url && (track.url.startsWith('http://') || track.url.startsWith('https://'))) {
                resource = createAudioResource(track.url, {
                    inlineVolume: true
                });
            }

            if (resource) {
                if (resource.volume) {
                    resource.volume.setVolume(queue.volume / 100);
                }
                queue.resource = resource;
                queue.player.play(resource);
            } else {
                throw new Error('Unable to extract playable audio stream');
            }
        } catch (streamError) {
            logger.error(`Audio stream error for track "${track.title}" in guild ${guildId}`, streamError, 'MUSIC');
            if (queue.textChannel) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.bot.colors.danger)
                    .setTitle('⚠️ Audio Stream Error')
                    .setDescription(`Could not stream **${track.title}**. Skipping to next track in queue...`);
                queue.textChannel.send({ embeds: [errorEmbed] }).catch(() => {});
            }
            return this.playNext(guildId);
        }

        if (queue.textChannel) {
            const embed = this.createNowPlayingEmbed(guildId);
            const row = this.createControlButtons();
            queue.textChannel.send({ embeds: [embed], components: [row] }).catch(() => {});
        }
    }

    /**
     * Track completion handler with looping support
     */
    handleTrackEnd(guildId) {
        const queue = this.queues.get(guildId);
        if (!queue) return;

        if (queue.loopMode === 'song' && queue.currentTrack) {
            queue.tracks.unshift(queue.currentTrack);
        } else if (queue.loopMode === 'queue' && queue.currentTrack) {
            queue.tracks.push(queue.currentTrack);
        }

        this.playNext(guildId);
    }

    /**
     * Pause playback
     */
    pause(guildId) {
        const queue = this.queues.get(guildId);
        if (!queue || !queue.isPlaying) return false;
        queue.player.pause();
        queue.isPaused = true;
        return true;
    }

    /**
     * Resume playback
     */
    resume(guildId) {
        const queue = this.queues.get(guildId);
        if (!queue || !queue.isPaused) return false;
        queue.player.unpause();
        queue.isPaused = false;
        return true;
    }

    /**
     * Skip current track
     */
    skip(guildId) {
        const queue = this.queues.get(guildId);
        if (!queue || !queue.currentTrack) return null;
        const skipped = queue.currentTrack;
        this.playNext(guildId);
        return skipped;
    }

    /**
     * Stop and clear queue
     */
    stop(guildId) {
        const queue = this.queues.get(guildId);
        if (!queue) return false;
        queue.tracks = [];
        queue.currentTrack = null;
        queue.isPlaying = false;
        queue.player.stop();
        if (queue.connection) {
            try {
                queue.connection.destroy();
            } catch {
                // Connection might already be destroyed
            }
            queue.connection = null;
        }
        return true;
    }

    /**
     * Set playback volume
     */
    setVolume(guildId, volume) {
        const queue = this.queues.get(guildId);
        if (!queue) return false;
        queue.volume = Math.max(0, Math.min(volume, 100));
        if (queue.resource && queue.resource.volume) {
            queue.resource.volume.setVolume(queue.volume / 100);
        }
        return queue.volume;
    }

    /**
     * Toggle loop mode ('off' -> 'song' -> 'queue' -> 'off')
     */
    setLoop(guildId, mode = null) {
        const queue = this.queues.get(guildId);
        if (!queue) return 'off';

        if (mode) {
            queue.loopMode = mode;
        } else {
            const nextMode = { off: 'song', song: 'queue', queue: 'off' };
            queue.loopMode = nextMode[queue.loopMode] || 'off';
        }
        return queue.loopMode;
    }

    /**
     * Creates modern Now Playing embed with track info
     */
    createNowPlayingEmbed(guildId) {
        const queue = this.queues.get(guildId);
        if (!queue || !queue.currentTrack) {
            return new EmbedBuilder()
                .setColor(config.bot.colors.warning)
                .setDescription('No track currently playing.');
        }

        const track = queue.currentTrack;
        return new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle('🎶 Now Playing')
            .setDescription(`**[${track.title}](${track.url || 'https://discord.com'})**`)
            .addFields(
                { name: 'Duration', value: track.duration || '03:45', inline: true },
                { name: 'Requested By', value: track.requester || 'User', inline: true },
                { name: 'Loop Mode', value: `\`${queue.loopMode.toUpperCase()}\``, inline: true },
                { name: 'Volume', value: `\`${queue.volume}%\``, inline: true },
                { name: 'Queue Length', value: `${queue.tracks.length} track(s)`, inline: true },
                { name: 'Status', value: queue.isPaused ? '⏸️ Paused' : '▶️ Playing', inline: true }
            )
            .setThumbnail(track.thumbnail || 'https://cdn.discordapp.com/embed/avatars/0.png')
            .setFooter({ text: 'ChathuX Music System' });
    }

    /**
     * Interactive control buttons for music embeds
     */
    createControlButtons() {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('music_pause_resume').setEmoji('⏯️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('music_skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('music_loop').setEmoji('🔁').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_queue').setEmoji('📜').setStyle(ButtonStyle.Secondary)
        );
    }

    /**
     * Cleans up voice connection and queue
     */
    destroyQueue(guildId) {
        const queue = this.queues.get(guildId);
        if (queue) {
            if (queue.connection) {
                queue.connection.destroy();
            }
            this.queues.delete(guildId);
        }
    }
}

module.exports = new MusicService();
