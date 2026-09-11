const { SlashCommandBuilder } = require('discord.js');
const economyService = require('../../services/economyService');
const { createSuccessEmbed, createWarningEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily coin reward and build up your streak multiplier!'),
    async execute(interaction) {
        const result = await economyService.claimDaily(interaction.guild.id, interaction.user.id);

        if (!result.success) {
            return interaction.reply({
                embeds: [createWarningEmbed('Daily Reward Cooldown', result.reason)],
                ephemeral: true
            });
        }

        const embed = createSuccessEmbed(
            'Daily Reward Collected!',
            `You collected **${result.reward.toLocaleString()} coins** today!\n\n🔥 **Streak**: \`${result.streak} Day(s)\`\n🪙 **New Wallet Balance**: \`${result.newBalance.toLocaleString()} coins\``
        );

        await interaction.reply({ embeds: [embed] });
    }
};
