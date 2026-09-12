const { SlashCommandBuilder } = require('discord.js');
const afkService = require('../../services/afkService');
const { createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set your AFK (Away From Keyboard) status with an optional custom reason.')
        .addStringOption(opt =>
            opt.setName('reason')
                .setDescription('Why are you going AFK? (e.g., Lunch, Studying, Sleeping)')
                .setRequired(false)
        ),

    async execute(interaction) {
        const reason = interaction.options.getString('reason') || 'AFK (Away From Keyboard)';
        afkService.setAfk(interaction.guild.id, interaction.user.id, reason);

        const embed = createSuccessEmbed(
            'AFK Status Enabled',
            `💤 <@${interaction.user.id}> is now set to **AFK**.\n` +
            `📝 **Reason**: *${reason}*\n\n` +
            `*I will notify members who mention you in this server, and automatically clear your AFK status once you send another message!*`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
