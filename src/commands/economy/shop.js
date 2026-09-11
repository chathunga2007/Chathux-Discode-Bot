const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economyRepo = require('../../database/repositories/economyRepository');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Browse the items and role rewards available in the server shop.'),
    async execute(interaction) {
        const items = await economyRepo.getShopItems(interaction.guild.id);

        if (items.length === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor(config.bot.colors.info).setDescription('The server shop is currently empty. Check back soon!')]
            });
        }

        const itemList = items.map(item => {
            const stockStr = item.stock === -1 ? 'Unlimited' : `${item.stock} left`;
            return `🏷️ **${item.name}** (ID: \`${item.id}\`)\n> Price: **${item.price.toLocaleString()} coins** | Stock: *${stockStr}*\n> *${item.description || 'No description'}*`;
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle(`🛒 ${interaction.guild.name} Marketplace`)
            .setDescription(`Use \`/buy <item_id>\` to purchase an item!\n\n${itemList}`)
            .setFooter({ text: 'Earn coins by being active, chatting, and using /daily & /work' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
