const modRepo = require('../database/repositories/moderationRepository');
const guildRepo = require('../database/repositories/guildRepository');
const { containsInvite, containsUrl, countMentions, containsBadWords } = require('../utils/validators');
const { createModLogEmbed } = require('../utils/embeds');
const logger = require('../utils/logger');

class ModerationService {
    constructor() {
        this.messageFrequency = new Map(); // `${guildId}:${userId}` -> timestamps[]
        this.userStrikes = new Map(); // `${guildId}:${userId}` -> count
    }

    /**
     * Inspects a message for auto-moderation violations
     */
    async checkAutoMod(message) {
        if (!message.guild || message.author.bot) return null;

        const guildId = message.guild.id;
        const userId = message.author.id;
        const key = `${guildId}:${userId}`;

        const modSettings = await modRepo.getSettings(guildId);

        // 1. Anti-Spam (Rate limiting messages)
        if (modSettings.anti_spam) {
            const now = Date.now();
            const timestamps = this.messageFrequency.get(key) || [];
            const recent = timestamps.filter(t => now - t < 5000);
            recent.push(now);
            this.messageFrequency.set(key, recent);

            if (recent.length > 5) {
                return { action: 'SPAM', reason: 'Excessive message rate (Anti-Spam)' };
            }
        }

        // 2. Anti-Mention Spam
        if (modSettings.anti_mention) {
            const mentions = countMentions(message.content);
            if (mentions >= modSettings.max_mentions) {
                return { action: 'MENTION_SPAM', reason: `Mention spam (${mentions} mentions detected)` };
            }
        }

        // 3. Bad Word Filtering
        if (modSettings.filter_bad_words) {
            if (containsBadWords(message.content)) {
                return { action: 'PROFANITY', reason: 'Message contained prohibited language' };
            }
        }

        // 4. Link & Invite Filtering
        if (modSettings.filter_links) {
            if (containsInvite(message.content) || containsUrl(message.content)) {
                return { action: 'UNAUTHORIZED_LINK', reason: 'Posting links or Discord invites is restricted' };
            }
        }

        return null;
    }

    /**
     * Handles violation penalty (delete message, apply strike, auto-timeout)
     */
    async handleViolation(message, violation) {
        const guildId = message.guild.id;
        const userId = message.author.id;
        const key = `${guildId}:${userId}`;

        try {
            if (message.deletable) {
                await message.delete();
            }

            const currentStrikes = (this.userStrikes.get(key) || 0) + 1;
            this.userStrikes.set(key, currentStrikes);

            const modSettings = await modRepo.getSettings(guildId);
            const shouldTimeout = currentStrikes >= modSettings.auto_timeout_strikes;

            if (shouldTimeout && message.member && message.member.moderatable) {
                await message.member.timeout(10 * 60 * 1000, `Auto-Mod: Reached ${currentStrikes} violations (${violation.reason})`);
                await this.logModerationAction({
                    guild: message.guild,
                    user: message.author,
                    moderator: message.client.user,
                    action: 'TIMEOUT',
                    reason: `Auto-Mod: ${violation.reason} (${currentStrikes} strikes)`,
                    duration: 600
                });
                this.userStrikes.set(key, 0); // reset after timeout
            } else {
                await this.logModerationAction({
                    guild: message.guild,
                    user: message.author,
                    moderator: message.client.user,
                    action: 'WARN',
                    reason: `Auto-Mod [Strike ${currentStrikes}]: ${violation.reason}`
                });
            }

            const warningMsg = await message.channel.send({
                content: `⚠️ <@${userId}>, your message was removed: **${violation.reason}**.`
            });
            setTimeout(() => warningMsg.delete().catch(() => {}), 6000);
        } catch (error) {
            logger.error('Failed to execute auto-mod penalty', error, 'MODERATION');
        }
    }

    /**
     * Records a moderation action in the DB and dispatches an embed to the log channel
     */
    async logModerationAction({ guild, user, moderator, action, reason, duration = null }) {
        try {
            await modRepo.logAction(guild.id, user.id, moderator.id, action, reason, duration);

            const settings = await guildRepo.getSettings(guild.id);
            if (!settings.mod_channel_id && !settings.log_channel_id) return;

            const targetChannelId = settings.mod_channel_id || settings.log_channel_id;
            const logChannel = guild.channels.cache.get(targetChannelId);
            if (logChannel && logChannel.isTextBased()) {
                const embed = createModLogEmbed({ action, user, moderator, reason, duration });
                await logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            logger.error('Failed to log moderation action', error, 'MODERATION');
        }
    }
}

module.exports = new ModerationService();
