const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economyRepo = require('../../database/repositories/economyRepository');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy-leaderboard')
        .setDescription('Displays the wealthiest members on the server.'),
    async execute(interaction) {
        const topAccounts = await economyRepo.getLeaderboard(interaction.guild.id, 10);

        if (topAccounts.length === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor(config.bot.colors.info).setDescription('No economy data recorded yet. Use /daily or /work to start!')]
            });
        }

        const medals = ['🥇', '🥈', '🥉'];
        const list = topAccounts.map((entry, index) => {
            const prefix = medals[index] || `**#${index + 1}**`;
            const netWorth = (entry.balance || 0) + (entry.bank || 0);
            return `${prefix} <@${entry.user_id}> — **${netWorth.toLocaleString()} coins** (Wallet: ${entry.balance.toLocaleString()} | Bank: ${entry.bank.toLocaleString()})`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle(`💰 ${interaction.guild.name} Wealth Leaderboard`)
            .setDescription(list)
            .setFooter({ text: 'Rankings are based on total net worth (wallet + bank)' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
