const { SlashCommandBuilder } = require('discord.js');
const economyService = require('../../services/economyService');
const { createSuccessEmbed, createWarningEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Work a shift and earn coins (30-minute cooldown).'),
    async execute(interaction) {
        const result = await economyService.claimWork(interaction.guild.id, interaction.user.id);

        if (!result.success) {
            return interaction.reply({
                embeds: [createWarningEmbed('Rest Needed', result.reason)],
                ephemeral: true
            });
        }

        const embed = createSuccessEmbed(
            `💼 Job Completed: ${result.job}`,
            `${result.description}\n\n🪙 **New Wallet Balance**: \`${result.newBalance.toLocaleString()} coins\``
        );

        await interaction.reply({ embeds: [embed] });
    }
};
