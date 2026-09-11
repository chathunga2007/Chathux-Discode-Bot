const { SlashCommandBuilder } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Checks the bot latency and Discord API response time.'),
    async execute(interaction) {
        const sent = await interaction.reply({
            embeds: [createInfoEmbed('🏓 Pinging...', 'Measuring latency...')],
            fetchReply: true
        });

        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const wsPing = interaction.client.ws.ping;

        const embed = createInfoEmbed(
            '🏓 Pong! Latency Metrics',
            `📶 **API Roundtrip**: \`${roundtrip}ms\`\n💓 **WebSocket Heartbeat**: \`${wsPing}ms\``
        );

        await interaction.editReply({ embeds: [embed] });
    }
};
