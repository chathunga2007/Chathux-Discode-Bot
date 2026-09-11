const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Learn more about the ChathuX platform architecture and vision.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle('🔥 About ChathuX Platform')
            .setDescription(
                '**ChathuX** is an enterprise-grade Discord bot and server management suite engineered for modern communities. ' +
                'Built with a decoupled microservice architecture, ChathuX integrates intelligent AI assistance, granular server security, ' +
                'real-time audit logging, immersive leveling mechanics, virtual economies, and a modern glassmorphic web dashboard.'
            )
            .addFields(
                { name: '🚀 Core Architecture', value: 'Node.js, Discord.js v14, Express REST API, MySQL Connection Pool', inline: false },
                { name: '🧠 AI Integration', value: 'Provider abstraction supporting Google Gemini, OpenAI & local fallback engines', inline: false },
                { name: '🛡️ Moderation Engine', value: 'High-speed auto-mod, anti-spam, mention-limiters, bad-word filters, and automated timeouts', inline: false },
                { name: '🌐 Web Dashboard', value: 'Full Discord OAuth2 management suite with real-time stats and server customization', inline: false },
                { name: '🇱🇰 Cultural Polish', value: 'Bilingual responsiveness with natural Sinhala colloquial banter and support', inline: false }
            )
            .setFooter({ text: 'Designed and engineered for high-performance Discord communities.' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
