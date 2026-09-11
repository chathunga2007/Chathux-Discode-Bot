const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Displays comprehensive platform statistics and infrastructure details.'),
    async execute(interaction) {
        const client = interaction.client;
        const totalGuilds = client.guilds.cache.size;
        const totalMembers = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
        const totalChannels = client.channels.cache.size;

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle('🤖 ChathuX Platform Specifications')
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Bot Name', value: client.user.username, inline: true },
                { name: 'Discriminator', value: `#${client.user.discriminator || '0000'}`, inline: true },
                { name: 'Client ID', value: `\`${client.user.id}\``, inline: true },
                { name: 'Servers', value: `🏰 ${totalGuilds}`, inline: true },
                { name: 'Total Users Served', value: `👥 ${totalMembers.toLocaleString()}`, inline: true },
                { name: 'Channels Monitored', value: `💬 ${totalChannels}`, inline: true },
                { name: 'Slash Commands', value: `⚡ ${client.commands.size}`, inline: true },
                { name: 'Runtime', value: `Node.js ${process.version}`, inline: true },
                { name: 'Framework', value: 'Discord.js v14.18.0', inline: true },
                { name: 'Database Architecture', value: 'MySQL 8.0 + Connection Pooling', inline: true },
                { name: 'AI Engine', value: `Provider: \`${config.ai.provider}\``, inline: true },
                { name: 'Dashboard URL', value: `[Access Dashboard](${config.dashboard.url})`, inline: true }
            )
            .setFooter({ text: 'Engineered with clean architecture & high availability' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
