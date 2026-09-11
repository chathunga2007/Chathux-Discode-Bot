const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/connection');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Displays system health, memory usage, and operational status.'),
    async execute(interaction) {
        const mem = process.memoryUsage();
        const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotal = (mem.heapTotal / 1024 / 1024).toFixed(2);
        const rss = (mem.rss / 1024 / 1024).toFixed(2);

        const uptimeSeconds = Math.floor(process.uptime());
        const days = Math.floor(uptimeSeconds / (3600 * 24));
        const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle('⚡ ChathuX System Status')
            .addFields(
                { name: '🟢 Bot Core', value: 'Operational', inline: true },
                { name: '🗄️ Database', value: db.isConnected ? 'Connected (MySQL)' : 'In-Memory Fallback', inline: true },
                { name: '🌐 Dashboard API', value: `Listening on Port ${config.dashboard.port}`, inline: true },
                { name: '⏱️ Uptime', value: uptimeString, inline: true },
                { name: '🧠 Heap Usage', value: `${heapUsed} MB / ${heapTotal} MB`, inline: true },
                { name: '📦 RSS Memory', value: `${rss} MB`, inline: true },
                { name: '⚙️ Node.js', value: process.version, inline: true },
                { name: '🤖 Discord.js', value: 'v14.18.0+', inline: true },
                { name: '🔌 Ping', value: `${interaction.client.ws.ping}ms`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
