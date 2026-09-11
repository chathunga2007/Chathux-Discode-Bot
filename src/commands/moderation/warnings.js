const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const modRepo = require('../../database/repositories/moderationRepository');
const { config } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View the recorded infractions and warning history for a user.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose warnings to inspect')
                .setRequired(true)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const guildId = interaction.guild.id;

        const warnings = await modRepo.getWarnings(guildId, targetUser.id);

        if (warnings.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.bot.colors.success)
                .setTitle(`🛡️ Warnings: ${targetUser.tag}`)
                .setDescription('This member has a clean record with 0 recorded warnings!')
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }

        const warningList = warnings.map((w, index) => {
            const dateStr = w.created_at ? `<t:${Math.floor(new Date(w.created_at).getTime() / 1000)}:R>` : 'Unknown date';
            return `**#${index + 1}** | Moderator: <@${w.moderator_id}> (${dateStr})\n> *${w.reason}*`;
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.warning)
            .setTitle(`🛡️ Warnings for ${targetUser.tag} (${warnings.length})`)
            .setDescription(warningList.slice(0, 4000))
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
