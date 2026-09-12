const crypto = require('crypto');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { config } = require('../config/config');
const logger = require('../utils/logger');

class GiveawayService {
    constructor() {
        // Map<messageId, giveawayObject>
        this.giveaways = new Map();
    }

    /**
     * Parse human-readable duration string into milliseconds
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
     * Start a new giveaway
     */
    async startGiveaway({ client, channel, host, prize, durationMs, winnerCount = 1 }) {
        const endsAt = Date.now() + durationMs;
        const endsTimestamp = Math.floor(endsAt / 1000);

        const giveaway = {
            id: null, // Will be set to message.id
            guildId: channel.guild.id,
            channelId: channel.id,
            hostId: host.id,
            prize,
            winnerCount: Math.max(1, parseInt(winnerCount, 10)),
            endsAt,
            entrants: new Set(),
            ended: false,
            winners: []
        };

        const embed = this.buildActiveEmbed(giveaway, endsTimestamp);
        const row = this.buildButtonRow(0, false);

        const message = await channel.send({
            content: '🎉 **GIVEAWAY STARTED!** 🎉',
            embeds: [embed],
            components: [row]
        });

        giveaway.id = message.id;
        this.giveaways.set(message.id, giveaway);

        // Schedule automated ending
        setTimeout(async () => {
            await this.endGiveaway(client, message.id).catch(err => {
                logger.error(`Error auto-ending giveaway ${message.id}`, err, 'GIVEAWAY');
            });
        }, durationMs);

        logger.info(`Started giveaway ${message.id} for "${prize}" in guild ${channel.guild.id}`, 'GIVEAWAY');
        return message;
    }

    /**
     * Handle button click to enter/leave giveaway
     */
    toggleEntry(messageId, userId) {
        const giveaway = this.giveaways.get(messageId);
        if (!giveaway) return { success: false, reason: 'Giveaway not found or already ended.' };
        if (giveaway.ended) return { success: false, reason: 'This giveaway has already ended.' };

        let entered = false;
        if (giveaway.entrants.has(userId)) {
            giveaway.entrants.delete(userId);
            entered = false;
        } else {
            giveaway.entrants.add(userId);
            entered = true;
        }

        return {
            success: true,
            entered,
            count: giveaway.entrants.size,
            prize: giveaway.prize
        };
    }

    /**
     * End a giveaway and pick winner(s)
     */
    async endGiveaway(client, messageId) {
        const giveaway = this.giveaways.get(messageId);
        if (!giveaway || giveaway.ended) return null;

        giveaway.ended = true;

        try {
            const channel = await client.channels.fetch(giveaway.channelId);
            if (!channel) return null;

            const message = await channel.messages.fetch(messageId).catch(() => null);
            if (!message) return null;

            const entrantsList = Array.from(giveaway.entrants);
            const winners = [];

            if (entrantsList.length > 0) {
                const countToPick = Math.min(giveaway.winnerCount, entrantsList.length);
                const pool = [...entrantsList];

                for (let i = 0; i < countToPick; i++) {
                    const randIndex = crypto.randomInt(0, pool.length);
                    winners.push(pool[randIndex]);
                    pool.splice(randIndex, 1);
                }
            }

            giveaway.winners = winners;

            const endEmbed = new EmbedBuilder()
                .setColor(winners.length > 0 ? config.bot.colors.success : config.bot.colors.danger)
                .setTitle(`🎉 GIVEAWAY ENDED: ${giveaway.prize}`)
                .setDescription(
                    winners.length > 0
                        ? `🏆 **Winners**: ${winners.map(w => `<@${w}>`).join(', ')}\n👑 **Hosted By**: <@${giveaway.hostId}>\n🎟️ **Total Entries**: \`${giveaway.entrants.size}\``
                        : `No entries were received. No winner could be determined.\n👑 **Hosted By**: <@${giveaway.hostId}>`
                )
                .setFooter({ text: 'ChathuX Giveaways • Ended' })
                .setTimestamp();

            const disabledRow = this.buildButtonRow(giveaway.entrants.size, true);

            await message.edit({
                content: '🏁 **GIVEAWAY HAS CONCLUDED!**',
                embeds: [endEmbed],
                components: [disabledRow]
            }).catch(() => {});

            if (winners.length > 0) {
                await channel.send({
                    content: `🎉 Congratulations ${winners.map(w => `<@${w}>`).join(', ')}! You won **${giveaway.prize}**! 🎁`,
                    reply: { messageReference: messageId }
                }).catch(() => {});
            } else {
                await channel.send({
                    content: `⚠️ The giveaway for **${giveaway.prize}** ended with no valid entries.`,
                    reply: { messageReference: messageId }
                }).catch(() => {});
            }

            return giveaway;
        } catch (error) {
            logger.error(`Failed to end giveaway ${messageId}`, error, 'GIVEAWAY');
            return null;
        }
    }

    /**
     * Reroll winner(s) for an ended giveaway
     */
    async rerollGiveaway(client, messageId) {
        const giveaway = this.giveaways.get(messageId);
        if (!giveaway) {
            return { success: false, reason: 'Giveaway data not found or process was restarted.' };
        }
        if (!giveaway.ended) {
            return { success: false, reason: 'Cannot reroll a giveaway that is still actively running.' };
        }

        const entrantsList = Array.from(giveaway.entrants);
        if (entrantsList.length === 0) {
            return { success: false, reason: 'There were no entries in this giveaway to reroll from.' };
        }

        const newWinner = entrantsList[crypto.randomInt(0, entrantsList.length)];
        const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);

        if (channel) {
            await channel.send({
                content: `🎲 **REROLL!** Congratulations <@${newWinner}>! You are the new winner of **${giveaway.prize}**! 🎁`,
                reply: { messageReference: messageId }
            }).catch(() => {});
        }

        return { success: true, winner: newWinner, prize: giveaway.prize };
    }

    buildActiveEmbed(giveaway, endsTimestamp) {
        return new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle(`🎁 ${giveaway.prize}`)
            .setDescription(
                `Click the **Enter Giveaway** button below to participate!\n\n` +
                `⏰ **Ends**: <t:${endsTimestamp}:R> (<t:${endsTimestamp}:F>)\n` +
                `🏆 **Winners**: \`${giveaway.winnerCount}\`\n` +
                `👑 **Hosted By**: <@${giveaway.hostId}>`
            )
            .setFooter({ text: 'ChathuX Giveaways • Good Luck!' })
            .setTimestamp(new Date(giveaway.endsAt));
    }

    buildButtonRow(entryCount = 0, disabled = false) {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('giveaway_enter')
                .setLabel(`🎉 Enter Giveaway (${entryCount})`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled)
        );
    }
}

module.exports = new GiveawayService();
