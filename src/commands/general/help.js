const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');
const { config } = require('../../config/config');

const CATEGORY_DATA = {
    general: {
        title: '🌐 General Commands',
        description: 'Everyday utility and information commands.',
        commands: [
            '`/ping` - Test bot latency & WebSocket ping',
            '`/status` - Live CPU, memory & operational status',
            '`/help` - Interactive command navigator',
            '`/about` - Platform background & architectural overview',
            '`/serverinfo` - In-depth server statistics and metrics',
            '`/userinfo` - Detailed member profile and permissions',
            '`/avatar` - Retrieve high-resolution user avatar',
            '`/roles` - List server roles and member distribution',
            '`/uptime` - Time elapsed since last process restart',
            '`/botinfo` - Global bot statistics and deployment specs',
            '`/giveaway` - Host interactive giveaways with timers & buttons',
            '`/poll` - Launch real-time community polls with dynamic progress bars',
            '`/afk [reason]` - Set AFK status with mention alerts & auto-clear',
            '`/remind <time> <task>` - Set automated timed reminders'
        ]
    },
    moderation: {
        title: '🛡️ Moderation & Security',
        description: 'Server protection, user management, and automated moderation.',
        commands: [
            '`/kick <user> [reason]` - Kick member from server',
            '`/ban <user> [reason]` - Permanently ban member',
            '`/unban <user_id> [reason]` - Revoke server ban',
            '`/timeout <user> <duration> [reason]` - Put member in timeout',
            '`/untimeout <user>` - Remove active timeout',
            '`/warn <user> <reason>` - Issue an official warning strike',
            '`/warnings <user>` - View warning history for a user',
            '`/clear <amount>` - Bulk delete recent messages (1-100)',
            '`/slowmode <seconds>` - Adjust channel message cooldown',
            '`/lock` - Lock current channel to prevent member messages',
            '`/unlock` - Restore normal send permissions to channel',
            '`/modlog` - View recent moderation actions'
        ]
    },
    ai: {
        title: '🤖 AI Assistant',
        description: 'State-of-the-art conversational and engineering intelligence.',
        commands: [
            '`/ask <question>` - Ask anything with intelligent conversation memory',
            '`/code <problem>` - Generate optimized code and algorithms',
            '`/explain <code>` - Detailed breakdown of complex code',
            '`/translate <text> <language>` - Accurate multi-language translation',
            '`/summarize <text>` - Extract high-yield summary points',
            '`/ai-clear` - Reset active conversation context'
        ]
    },
    leveling: {
        title: '🏆 XP & Leveling',
        description: 'Engagement rewards and activity tracking.',
        commands: [
            '`/rank [user]` - View visual rank card, progress bar & stats',
            '`/level [user]` - Quick check of current level',
            '`/leaderboard` - Server top XP rankings',
            '`/levels` - Progression breakdown & required XP milestones',
            '`/xp [user]` - Raw XP statistics'
        ]
    },
    economy: {
        title: '💰 Virtual Economy',
        description: 'Server economy, daily rewards, careers, and marketplace.',
        commands: [
            '`/balance [user]` - Check wallet and bank balance',
            '`/daily` - Claim daily coins with streak multipliers',
            '`/work` - Undertake work scenarios to earn currency',
            '`/slots <bet>` - Test your luck on the casino slot machine',
            '`/pay <user> <amount>` - Secure peer-to-peer coin transfer',
            '`/shop` - View server marketplace catalog',
            '`/buy <item_id>` - Purchase item or role reward',
            '`/inventory` - View acquired items and badges',
            '`/economy-leaderboard` - Server richest members ranking'
        ]
    },
    music: {
        title: '🎵 Music Player',
        description: 'High-fidelity audio streaming and queue controls.',
        commands: [
            '`/play <query_or_url>` - Queue a track or playlist',
            '`/pause` - Pause audio playback',
            '`/resume` - Unpause active audio stream',
            '`/skip` - Advance to next queued track',
            '`/stop` - Stop playback and clear queue',
            '`/queue` - View upcoming queued tracks',
            '`/nowplaying` - View interactive track card with buttons',
            '`/volume <0-100>` - Adjust player volume',
            '`/loop [off|song|queue]` - Toggle track or queue repeating'
        ]
    },
    fun: {
        title: '🎉 Fun & Games',
        description: 'Entertainment, party games, and Sinhala-friendly banter.',
        commands: [
            '`/joke` - Random hilarious joke',
            '`/meme` - Fresh curated meme',
            '`/cat` - Cute cat images and facts',
            '`/dog` - Friendly dog photos',
            '`/8ball <question>` - Mystic fortune teller',
            '`/coinflip` - Flip a coin (Heads/Tails)',
            '`/dice [sides]` - Roll random polyhedral dice',
            '`/roast [user]` - Playful and savage roasts',
            '`/ship <user1> <user2>` - Love compatibility calculator',
            '`/rate <subject>` - Rate anything on a 1-10 scale',
            '`/choose <options>` - Let ChathuX decide between choices'
        ]
    },
    config: {
        title: '⚙️ Server Configuration',
        description: 'Customize modules and channels for your community.',
        commands: [
            '`/config` - View active server settings summary',
            '`/config welcome` - Setup welcome channel, message & auto-role',
            '`/config logs` - Setup audit log channel',
            '`/config moderation` - Configure auto-mod filters & mod logs',
            '`/config ai` - Set dedicated AI channel & enable/disable',
            '`/config leveling` - Set level-up channel & XP toggle',
            '`/config economy` - Toggle virtual economy features'
        ]
    }
};

function getCategoryHelpEmbed(categoryKey) {
    const cat = CATEGORY_DATA[categoryKey] || CATEGORY_DATA.general;
    return new EmbedBuilder()
        .setColor(config.bot.colors.primary)
        .setTitle(cat.title)
        .setDescription(`${cat.description}\n\n${cat.commands.join('\n')}`)
        .setFooter({ text: 'Select another category below to explore more commands.' })
        .setTimestamp();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Explore all available commands across modules.'),
    async execute(interaction) {
        const overviewEmbed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle('🔥 ChathuX Command Center')
            .setDescription(
                'Welcome to **ChathuX**, the premier multi-purpose Discord platform.\n' +
                'Select a category from the dropdown below to view all commands and usage syntax.'
            )
            .addFields(
                { name: '🌐 General', value: '`/ping`, `/status`, `/serverinfo`, `/userinfo`...', inline: true },
                { name: '🛡️ Moderation', value: '`/kick`, `/ban`, `/timeout`, `/warn`, `/clear`...', inline: true },
                { name: '🤖 AI Assistant', value: '`/ask`, `/code`, `/explain`, `/translate`...', inline: true },
                { name: '🏆 Leveling', value: '`/rank`, `/leaderboard`, `/levels`, `/xp`...', inline: true },
                { name: '💰 Economy', value: '`/balance`, `/daily`, `/work`, `/pay`, `/shop`...', inline: true },
                { name: '🎵 Music', value: '`/play`, `/pause`, `/skip`, `/queue`, `/nowplaying`...', inline: true },
                { name: '🎉 Fun', value: '`/joke`, `/meme`, `/8ball`, `/roast`, `/ship`...', inline: true },
                { name: '⚙️ Config', value: '`/config` (welcome, logs, mod, ai, leveling)...', inline: true }
            )
            .setFooter({ text: 'ChathuX Platform • Use /help anytime' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('Choose a module category...')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('General & Utilities').setValue('general').setEmoji('🌐'),
                new StringSelectMenuOptionBuilder().setLabel('Moderation & Security').setValue('moderation').setEmoji('🛡️'),
                new StringSelectMenuOptionBuilder().setLabel('AI Assistant').setValue('ai').setEmoji('🤖'),
                new StringSelectMenuOptionBuilder().setLabel('XP & Leveling').setValue('leveling').setEmoji('🏆'),
                new StringSelectMenuOptionBuilder().setLabel('Economy & Shop').setValue('economy').setEmoji('💰'),
                new StringSelectMenuOptionBuilder().setLabel('Music Player').setValue('music').setEmoji('🎵'),
                new StringSelectMenuOptionBuilder().setLabel('Fun & Entertainment').setValue('fun').setEmoji('🎉'),
                new StringSelectMenuOptionBuilder().setLabel('Server Configuration').setValue('config').setEmoji('⚙️')
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({ embeds: [overviewEmbed], components: [row] });
    },
    getCategoryHelpEmbed
};
