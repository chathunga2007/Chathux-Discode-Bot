const { EmbedBuilder } = require('discord.js');
const { config } = require('../config/config');
const logger = require('../utils/logger');

class ReminderService {
    constructor() {
        this.reminders = new Map();
    }

    /**
     * Parse human-readable duration
     * e.g., '30s', '10m', '2h', '1d'
     */
    parseDuration(str) {
        if (!str) return null;
        const match = str.trim().match(/^(\d+)\s*([smhd])$/i);
        if (!match) return null;

        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();

        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return null;
        }
    }

    /**
     * Schedule a reminder
     */
    scheduleReminder({ client, userId, channelId, task, durationMs }) {
        const id = `${userId}_${Date.now()}`;
        const fireTime = Date.now() + durationMs;

        const timer = setTimeout(async () => {
            this.reminders.delete(id);

            const embed = new EmbedBuilder()
                .setColor(config.bot.colors.primary)
                .setTitle('⏰ Reminder Alert!')
                .setDescription(`🔔 <@${userId}>, here is your scheduled reminder:\n\n> **${task}**`)
                .setFooter({ text: 'ChathuX Reminder Assistant' })
                .setTimestamp();

            try {
                const channel = await client.channels.fetch(channelId).catch(() => null);
                if (channel && channel.isTextBased()) {
                    await channel.send({ content: `<@${userId}>`, embeds: [embed] });
                } else {
                    const user = await client.users.fetch(userId).catch(() => null);
                    if (user) {
                        await user.send({ embeds: [embed] }).catch(() => {});
                    }
                }
            } catch (err) {
                logger.error(`Failed to dispatch reminder to user ${userId}`, err, 'REMINDER');
            }
        }, durationMs);

        this.reminders.set(id, { userId, channelId, task, fireTime, timer });
        return { id, fireTime };
    }
}

module.exports = new ReminderService();
