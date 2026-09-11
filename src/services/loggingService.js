const { EmbedBuilder } = require('discord.js');
const guildRepo = require('../database/repositories/guildRepository');
const { config } = require('../config/config');
const logger = require('../utils/logger');

class LoggingService {
    async logEvent(guild, { title, description, color, fields = [] }) {
        if (!guild) return;

        try {
            const settings = await guildRepo.getSettings(guild.id);
            if (!settings.logging_enabled || !settings.log_channel_id) return;

            const logChannel = guild.channels.cache.get(settings.log_channel_id);
            if (!logChannel || !logChannel.isTextBased()) return;

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color || config.bot.colors.info)
                .setTimestamp();

            if (fields.length > 0) {
                embed.addFields(fields);
            }

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            logger.error(`Failed to send log event to guild ${guild.id}`, error, 'LOGGING_SERVICE');
        }
    }
}

module.exports = new LoggingService();
