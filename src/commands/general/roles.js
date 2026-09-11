const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roles')
        .setDescription('Lists all server roles and member distribution.'),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const roles = guild.roles.cache
            .filter(r => r.id !== guild.id)
            .sort((a, b) => b.position - a.position)
            .map(r => `${r} - \`${r.members.size} members\``);

        const displayedRoles = roles.slice(0, 25).join('\n');
        const remaining = roles.length - 25;

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle(`🏷️ Server Roles (${roles.length})`)
            .setDescription(
                displayedRoles + (remaining > 0 ? `\n\n*...and ${remaining} more roles.*` : '')
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
