const { SlashCommandBuilder } = require('discord.js');
const musicService = require('../../services/musicService');
const { createSuccessEmbed, createWarningEmbed, createInfoEmbed, createErrorEmbed } = require('../../utils/embeds');
const play = require('play-dl');

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return 'Live / Audio';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play audio or enqueue a song from SoundCloud, audio URL, or search term.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song title, artist name, SoundCloud URL, or direct audio link')
                .setRequired(true)
        ),
    async execute(interaction) {
        // Acknowledge interaction immediately to prevent 3-second Discord timeouts (10062)
        await interaction.deferReply();

        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
            return interaction.editReply({
                embeds: [createWarningEmbed('Voice Channel Required', 'You must join a voice channel before playing music!')]
            });
        }

        const query = interaction.options.getString('query').trim();

        try {
            await musicService.ensureClientInit();

            let track = null;

            // 1. Direct YouTube Video URL (e.g. youtube.com/watch?v= or youtu.be/)
            if (play.yt_validate(query) === 'video') {
                try {
                    const ytInfo = await play.video_basic_info(query);
                    if (ytInfo && ytInfo.video_details) {
                        const rawTitle = ytInfo.video_details.title;
                        const cleanTitle = rawTitle.replace(/\(Official.*?\)|\[Official.*?\]|\(Music Video\)|\[HD\]|\(Audio\)/gi, '').trim();
                        const scResults = await play.search(cleanTitle, { source: { soundcloud: 'tracks' }, limit: 1 });
                        if (scResults && scResults.length > 0) {
                            track = {
                                title: rawTitle,
                                url: query,
                                streamUrl: scResults[0].url,
                                duration: formatDuration(ytInfo.video_details.durationInSec || scResults[0].durationInSec),
                                requester: interaction.user.tag,
                                thumbnail: ytInfo.video_details.thumbnails[0]?.url || scResults[0].thumbnail
                            };
                        }
                    }
                } catch {
                    // Fall back to general resolution
                }
            }

            // 2. Direct Spotify Track URL (e.g. open.spotify.com/track/...)
            if (!track && play.sp_validate(query) === 'track') {
                try {
                    const spData = await play.spotify(query);
                    if (spData) {
                        const artistNames = spData.artists ? spData.artists.map(a => a.name).join(' ') : '';
                        const searchQuery = `${spData.name} ${artistNames}`.trim();
                        const scResults = await play.search(searchQuery, { source: { soundcloud: 'tracks' }, limit: 1 });
                        if (scResults && scResults.length > 0) {
                            track = {
                                title: `${spData.name} - ${spData.artists?.[0]?.name || ''}`,
                                url: query,
                                streamUrl: scResults[0].url,
                                duration: formatDuration(spData.durationInSec || scResults[0].durationInSec),
                                requester: interaction.user.tag,
                                thumbnail: spData.thumbnail?.url || scResults[0].thumbnail
                            };
                        }
                    }
                } catch {
                    // Fall back
                }
            }

            // 3. Direct SoundCloud Track URL
            if (!track && query.includes('soundcloud.com')) {
                try {
                    const scInfo = await play.soundcloud(query);
                    if (scInfo) {
                        track = {
                            title: scInfo.name || 'SoundCloud Track',
                            url: scInfo.permalink || scInfo.url,
                            streamUrl: scInfo.url,
                            duration: formatDuration(scInfo.durationInSec),
                            requester: interaction.user.tag,
                            thumbnail: scInfo.thumbnail || 'https://cdn.discordapp.com/embed/avatars/0.png'
                        };
                    }
                } catch {
                    // Fall back
                }
            }

            // 4. Direct Audio Stream / MP3 URL (.mp3, .ogg, .wav, .m3u8)
            if (!track && (query.startsWith('http://') || query.startsWith('https://'))) {
                if (query.match(/\.(mp3|wav|ogg|aac|flac|m3u8)(\?.*)?$/i)) {
                    const cleanName = query.split('/').pop().split('?')[0];
                    track = {
                        title: decodeURIComponent(cleanName) || 'Online Audio Stream',
                        url: query,
                        streamUrl: query,
                        duration: 'Live Audio',
                        requester: interaction.user.tag,
                        thumbnail: 'https://cdn.discordapp.com/embed/avatars/0.png'
                    };
                }
            }

            // 5. Query Search: Direct SoundCloud search
            if (!track) {
                try {
                    const searchResults = await play.search(query, {
                        source: { soundcloud: 'tracks' },
                        limit: 1
                    });

                    if (searchResults && searchResults.length > 0) {
                        const hit = searchResults[0];
                        track = {
                            title: hit.name || query,
                            url: hit.permalink || hit.url,
                            streamUrl: hit.url,
                            duration: formatDuration(hit.durationInSec),
                            requester: interaction.user.tag,
                            thumbnail: hit.thumbnail || 'https://cdn.discordapp.com/embed/avatars/0.png'
                        };
                    }
                } catch {
                    // Fall back to fuzzy YouTube metadata matching
                }
            }

            // 6. Intelligent Fallback: Search YouTube to find official track name, then match on audio stream
            if (!track) {
                try {
                    const ytSearch = await play.search(query, { limit: 1 });
                    if (ytSearch && ytSearch.length > 0) {
                        const officialTitle = ytSearch[0].title.replace(/\(Official.*?\)|\[Official.*?\]|\(Music Video\)|\(Audio\)/gi, '').trim();
                        const scMatch = await play.search(officialTitle, { source: { soundcloud: 'tracks' }, limit: 1 });
                        if (scMatch && scMatch.length > 0) {
                            track = {
                                title: ytSearch[0].title,
                                url: ytSearch[0].url,
                                streamUrl: scMatch[0].url,
                                duration: formatDuration(ytSearch[0].durationInSec || scMatch[0].durationInSec),
                                requester: interaction.user.tag,
                                thumbnail: ytSearch[0].thumbnails[0]?.url || scMatch[0].thumbnail
                            };
                        }
                    }
                } catch {
                    // Handled below
                }
            }

            if (!track) {
                return interaction.editReply({
                    embeds: [createWarningEmbed(
                        'Track Not Found',
                        `Could not find playable audio matching: **${query}**.\n\n💡 **Tip:** Try typing the song name with the artist (e.g. \`/play query: Yohani Manike Mage Hithe\` or \`/play query: Alan Walker Faded\`).`
                    )]
                });
            }

            const result = await musicService.enqueue(voiceChannel, interaction.channel, track);

            if (result.added) {
                const embed = createSuccessEmbed(
                    'Added to Queue',
                    `🎶 **[${track.title}](${track.url})**\n⏳ Duration: \`${track.duration}\` | Position: **#${result.position}**`
                );
                await interaction.editReply({ embeds: [embed] });
            } else {
                const embed = createInfoEmbed(
                    '🎶 Now Playing',
                    `Started playing **[${track.title}](${track.url})** in <#${voiceChannel.id}>!`
                );
                await interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            await interaction.editReply({
                embeds: [createErrorEmbed('Playback Error', `An error occurred while attempting to stream this track: ${error.message}`)]
            });
        }
    }
};
