const { SlashCommandBuilder } = require('discord.js');
const economyRepo = require('../../database/repositories/economyRepository');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Purchase an item from the server shop.')
        .addIntegerOption(option =>
            option.setName('item_id')
                .setDescription('The ID of the item you want to purchase')
                .setRequired(true)
        ),
    async execute(interaction) {
        const itemId = interaction.options.getInteger('item_id');
        const items = await economyRepo.getShopItems(interaction.guild.id);
        const item = items.find(i => i.id === itemId);

        if (!item) {
            return interaction.reply({
                embeds: [createErrorEmbed('Item Not Found', `No item found with ID \`${itemId}\`. Use \`/shop\` to see available items.`)],
                ephemeral: true
            });
        }

        const account = await economyRepo.getAccount(interaction.guild.id, interaction.user.id);
        if (account.balance < item.price) {
            return interaction.reply({
                embeds: [createErrorEmbed('Insufficient Funds', `You need **${item.price.toLocaleString()} coins** to purchase this, but only have **${account.balance.toLocaleString()} coins** in your wallet.`)],
                ephemeral: true
            });
        }

        // Deduct price and add to inventory
        await economyRepo.updateBalance(interaction.guild.id, interaction.user.id, -item.price);

        const embed = createSuccessEmbed(
            'Purchase Successful!',
            `You purchased **${item.name}** for **${item.price.toLocaleString()} coins**!\n\nCheck your \`/inventory\` anytime.`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
