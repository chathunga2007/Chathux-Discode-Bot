const { EmbedBuilder } = require('discord.js');
const { config } = require('../config/config');

const colors = config.bot.colors;

/**
 * Creates a standard success embed
 */
function createSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(colors.success)
        .setTitle(`✔ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Creates a standard error embed
 */
function createErrorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(colors.danger)
        .setTitle(`✖ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Creates a standard warning embed
 */
function createWarningEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(colors.warning)
        .setTitle(`⚠ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Creates a standard info / themed embed
 */
function createInfoEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp()
        .setFooter({ text: 'ChathuX Platform', iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png' });
}

/**
 * Creates an ASCII progress bar
 */
function createProgressBar(current, max, size = 15) {
    const percent = Math.min(Math.max(current / max, 0), 1);
    const progress = Math.round(size * percent);
    const emptyProgress = size - progress;

    const progressText = '█'.repeat(progress);
    const emptyProgressText = '░'.repeat(emptyProgress);
    const percentageText = `${Math.round(percent * 100)}%`;

    return `[${progressText}${emptyProgressText}] ${percentageText}`;
}

/**
 * Formats a Moderation Log Embed
 */
function createModLogEmbed({ action, user, moderator, reason = 'No reason provided', duration = null }) {
    const embed = new EmbedBuilder()
        .setColor(colors.danger)
        .setTitle(`🛡️ MODERATION AUDIT: ${action.toUpperCase()}`)
        .addFields(
            { name: 'Target User', value: `${user.tag || user.username || user} (\`${user.id || user}\`)`, inline: true },
            { name: 'Moderator', value: `${moderator.tag || moderator.username || moderator}`, inline: true },
            { name: 'Action', value: `\`${action}\``, inline: true },
            { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

    if (duration) {
        embed.addFields({ name: 'Duration', value: `${duration} seconds`, inline: true });
    }

    return embed;
}

module.exports = {
    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed,
    createInfoEmbed,
    createProgressBar,
    createModLogEmbed
};
