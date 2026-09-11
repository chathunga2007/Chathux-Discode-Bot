const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economyRepo = require('../../database/repositories/economyRepository');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your or another member\'s wallet and bank balance.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose balance to inspect')
                .setRequired(false)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const account = await economyRepo.getAccount(interaction.guild.id, targetUser.id);
        const netWorth = (account.balance || 0) + (account.bank || 0);

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle(`💳 Financial Account: ${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🪙 Wallet', value: `\`${account.balance.toLocaleString()} coins\``, inline: true },
                { name: '🏦 Bank', value: `\`${account.bank.toLocaleString()} coins\``, inline: true },
                { name: '💎 Net Worth', value: `\`${netWorth.toLocaleString()} coins\``, inline: true },
                { name: '🔥 Daily Streak', value: `\`${account.streak || 0} day(s)\``, inline: true }
            )
            .setFooter({ text: 'Use /daily and /work to grow your wealth!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
