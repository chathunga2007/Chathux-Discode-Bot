const moderationService = require('../services/moderationService');
const xpService = require('../services/xpService');
const aiService = require('../services/aiService');
const guildRepo = require('../database/repositories/guildRepository');
const logger = require('../utils/logger');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        try {
            // 1. Auto-Moderation Inspection
            const violation = await moderationService.checkAutoMod(message);
            if (violation) {
                await moderationService.handleViolation(message, violation);
                return; // Cease further processing of prohibited message
            }

            // 2. XP Progression Handling
            await xpService.handleMessageXP(message);

            // 3. AFK Status Management (Welcome Back & Mention Alerts)
            const afkService = require('../services/afkService');
            
            // If the author was AFK, welcome them back and remove AFK status
            const authorAfk = afkService.clearAfk(message.guild.id, message.author.id);
            if (authorAfk) {
                const timeAway = afkService.formatTimeAgo(authorAfk.timestamp);
                message.reply({
                    content: `👋 Welcome back <@${message.author.id}>! I have removed your AFK status. (You were away for ${timeAway})`
                }).catch(() => {});
            }

            // If someone mentions an AFK user, notify the channel
            if (message.mentions.users.size > 0) {
                for (const mentionedUser of message.mentions.users.values()) {
                    if (mentionedUser.bot || mentionedUser.id === message.author.id) continue;
                    const afkData = afkService.getAfk(message.guild.id, mentionedUser.id);
                    if (afkData) {
                        const timeAway = afkService.formatTimeAgo(afkData.timestamp);
                        message.reply({
                            content: `💤 **${mentionedUser.username}** is currently AFK: *${afkData.reason}* (${timeAway})`
                        }).catch(() => {});
                        break; // Avoid spamming multiple notifications per message
                    }
                }
            }

            // 3. AI Channel & Bot Mention Natural Chat Mode
            const settings = await guildRepo.getSettings(message.guild.id);
            const isDedicatedAiChannel = settings.ai_enabled && settings.ai_channel_id === message.channel.id;
            const isBotMentioned = message.mentions.has(client.user) && !message.mentions.everyone;

            if (isDedicatedAiChannel || isBotMentioned) {
                // Send typing indicator
                await message.channel.sendTyping().catch(() => {});

                // Strip bot mention from prompt
                const cleanContent = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
                const prompt = cleanContent || 'Hello ChathuX!';

                const reply = await aiService.generateResponse({
                    prompt,
                    userId: message.author.id,
                    guildId: message.guild.id,
                    channelId: message.channel.id
                });

                await message.reply({ content: reply }).catch(() => {});
            }
        } catch (error) {
            logger.error('Error handling messageCreate event', error, 'MESSAGE_CREATE');
        }
    }
};
