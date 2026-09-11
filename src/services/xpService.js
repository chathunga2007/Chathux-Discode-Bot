const xpRepo = require('../database/repositories/xpRepository');
const guildRepo = require('../database/repositories/guildRepository');
const { createProgressBar, createInfoEmbed } = require('../utils/embeds');
const logger = require('../utils/logger');

class XPService {
    constructor() {
        this.cooldowns = new Map(); // `${guildId}:${userId}` -> timestamp
    }

    /**
     * Calculates required total XP to achieve a given level
     */
    getXPForLevel(level) {
        if (level <= 0) return 0;
        return Math.floor(100 * Math.pow(level, 1.5));
    }

    /**
     * Calculates current level from total accumulated XP
     */
    getLevelFromXP(xp) {
        if (!xp || xp <= 0) return 0;
        return Math.floor(Math.pow(xp / 100, 1 / 1.5));
    }

    /**
     * Handles message XP accrual with 60-second cooldown
     */
    async handleMessageXP(message) {
        if (!message.guild || message.author.bot) return;

        const guildId = message.guild.id;
        const userId = message.author.id;
        const key = `${guildId}:${userId}`;

        const settings = await guildRepo.getSettings(guildId);
        if (!settings.leveling_enabled) return;

        const now = Date.now();
        const lastGain = this.cooldowns.get(key) || 0;
        if (now - lastGain < 60000) return; // 60s cooldown

        this.cooldowns.set(key, now);

        // Random 15-25 XP
        const xpGain = Math.floor(Math.random() * 11) + 15;
        const currentUserXP = await xpRepo.getUserXP(guildId, userId);
        const oldLevel = currentUserXP.level;
        const newTotalXP = currentUserXP.xp + xpGain;
        const newLevel = this.getLevelFromXP(newTotalXP);

        await xpRepo.addXP(guildId, userId, xpGain, newLevel);

        if (newLevel > oldLevel) {
            await this.handleLevelUp(message, newLevel, settings);
        }
    }

    /**
     * Sends level-up notification to levelChannel or current channel
     */
    async handleLevelUp(message, newLevel, settings) {
        try {
            const targetChannel = settings.level_channel_id
                ? message.guild.channels.cache.get(settings.level_channel_id) || message.channel
                : message.channel;

            if (targetChannel && targetChannel.isTextBased()) {
                const embed = createInfoEmbed(
                    '🎉 Level Up!',
                    `Congratulations <@${message.author.id}>, you've leveled up to **Level ${newLevel}**! Keep chatting to climb the leaderboard!`
                );
                await targetChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            logger.error('Error handling level-up announcement', error, 'LEVELING');
        }
    }

    /**
     * Formats rank card details
     */
    async getRankDetails(guildId, user) {
        const data = await xpRepo.getUserXP(guildId, user.id);
        const rank = await xpRepo.getUserRank(guildId, user.id);
        const currentLevel = data.level;
        const currentLevelBaseXP = this.getXPForLevel(currentLevel);
        const nextLevelTargetXP = this.getXPForLevel(currentLevel + 1);

        const xpInCurrentLevel = Math.max(data.xp - currentLevelBaseXP, 0);
        const xpRequiredForNext = Math.max(nextLevelTargetXP - currentLevelBaseXP, 1);
        const progressBar = createProgressBar(xpInCurrentLevel, xpRequiredForNext, 16);

        return {
            user,
            rank,
            level: currentLevel,
            totalXp: data.xp,
            currentXp: xpInCurrentLevel,
            requiredXp: xpRequiredForNext,
            progressBar
        };
    }
}

module.exports = new XPService();
