const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economyRepo = require('../../database/repositories/economyRepository');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('View items and collectibles stored in your inventory.'),
    async execute(interaction) {
        const inventory = await economyRepo.getInventory(interaction.guild.id, interaction.user.id);

        if (inventory.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.bot.colors.info)
                .setTitle(`🎒 ${interaction.user.username}'s Inventory`)
                .setDescription('Your inventory is empty! Check out the `/shop` to buy items.')
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }

        const itemsList = inventory.map(entry => {
            return `📦 **${entry.name}** × ${entry.quantity}\n> *${entry.description || 'Collectible item'}*`;
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle(`🎒 ${interaction.user.username}'s Inventory (${inventory.length} items)`)
            .setDescription(itemsList)
            .setFooter({ text: 'Items can provide special perks and status' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
