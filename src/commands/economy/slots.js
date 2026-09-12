const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const economyRepo = require('../../database/repositories/economyRepository');
const { config } = require('../../config/config');
const { createErrorEmbed } = require('../../utils/embeds');

const SYMBOLS = [
    { emoji: '🍒', name: 'Cherry', weight: 32 },
    { emoji: '🍋', name: 'Lemon', weight: 26 },
    { emoji: '🍇', name: 'Grape', weight: 20 },
    { emoji: '🔔', name: 'Bell', weight: 12 },
    { emoji: '💎', name: 'Diamond', weight: 7 },
    { emoji: '7️⃣', name: 'Seven', weight: 3 }
];

function getRandomSymbol() {
    const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    let rand = Math.random() * totalWeight;

    for (const sym of SYMBOLS) {
        if (rand < sym.weight) {
            return sym.emoji;
        }
        rand -= sym.weight;
    }
    return SYMBOLS[0].emoji;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Test your luck on the ChathuX Casino Slot Machine!')
        .addIntegerOption(opt =>
            opt.setName('bet')
                .setDescription('Amount of coins to wager (minimum 10 coins)')
                .setMinValue(10)
                .setRequired(true)
        ),

    async execute(interaction) {
        const bet = interaction.options.getInteger('bet');
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const account = await economyRepo.getAccount(guildId, userId);
        if (account.balance < bet) {
            return interaction.reply({
                embeds: [createErrorEmbed('Insufficient Funds', `You only have **${account.balance.toLocaleString()} coins** in your wallet. You cannot bet **${bet.toLocaleString()} coins**!`)],
                flags: MessageFlags.Ephemeral
            });
        }

        // Deduct the bet
        await economyRepo.updateBalance(guildId, userId, -bet);

        // Spin the reels
        const reel1 = getRandomSymbol();
        const reel2 = getRandomSymbol();
        const reel3 = getRandomSymbol();

        let multiplier = 0;
        let title = '';
        let color = config.bot.colors.danger;

        if (reel1 === reel2 && reel2 === reel3) {
            if (reel1 === '7️⃣') {
                multiplier = 10;
                title = '🚨 JACKPOT! TRIPLE SEVENS! 🚨';
                color = '#FFD700'; // Gold
            } else if (reel1 === '💎') {
                multiplier = 6;
                title = '💎 MEGA WIN! TRIPLE DIAMONDS! 💎';
                color = '#00FFFF'; // Cyan
            } else if (reel1 === '🔔') {
                multiplier = 4;
                title = '🔔 BIG WIN! GOLDEN BELLS! 🔔';
                color = '#FFA500'; // Orange
            } else if (reel1 === '🍇') {
                multiplier = 3;
                title = '🍇 SWEET WIN! TRIPLE GRAPES! 🍇';
                color = '#8A2BE2'; // Purple
            } else {
                multiplier = 2.5;
                title = '🍒 FRUIT FEVER! TRIPLE MATCH! 🍒';
                color = config.bot.colors.success;
            }
        } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
            multiplier = 1.5;
            title = '✨ NICE! DOUBLE MATCH! ✨';
            color = config.bot.colors.success;
        } else {
            title = '💀 BETTER LUCK NEXT TIME! 💀';
            color = config.bot.colors.danger;
        }

        const winnings = Math.floor(bet * multiplier);
        if (winnings > 0) {
            await economyRepo.updateBalance(guildId, userId, winnings);
        }

        const updatedAccount = await economyRepo.getAccount(guildId, userId);
        const netProfit = winnings - bet;
        const profitString = netProfit > 0
            ? `+${netProfit.toLocaleString()} coins 🟢`
            : `${netProfit.toLocaleString()} coins 🔴`;

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(
                `\`\`\`\n` +
                `╔═════════════════════╗\n` +
                `║   CHATHUX CASINO    ║\n` +
                `╠═════════════════════╣\n` +
                `║    [ ${reel1} | ${reel2} | ${reel3} ]    ║\n` +
                `╚═════════════════════╝\n` +
                `\`\`\`\n` +
                `🪙 **Wager**: \`${bet.toLocaleString()} coins\`\n` +
                `🎯 **Multiplier**: \`${multiplier}x\`\n` +
                `🎁 **Payout**: \`${winnings.toLocaleString()} coins\` (${profitString})\n\n` +
                `💼 **New Wallet Balance**: \`${updatedAccount.balance.toLocaleString()} coins\``
            )
            .setFooter({ text: 'ChathuX Virtual Casino • Gamble Responsibly' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
