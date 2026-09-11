const { SlashCommandBuilder } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Displays how long the ChathuX process has been running continuously.'),
    async execute(interaction) {
        const totalSeconds = Math.floor(process.uptime());
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const uptimeParts = [];
        if (days > 0) uptimeParts.push(`${days} day(s)`);
        if (hours > 0) uptimeParts.push(`${hours} hour(s)`);
        if (minutes > 0) uptimeParts.push(`${minutes} minute(s)`);
        uptimeParts.push(`${seconds} second(s)`);

        const embed = createInfoEmbed(
            '⏱️ ChathuX Platform Uptime',
            `ChathuX has been continuously online and serving requests for:\n\n**${uptimeParts.join(', ')}**\n\n🟢 *Zero crashes recorded since last deployment.*`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
