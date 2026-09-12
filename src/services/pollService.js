const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { config } = require('../config/config');

class PollService {
    constructor() {
        // Map<messageId, pollObject>
        this.polls = new Map();
    }

    /**
     * Helper to build a visual text progress bar
     */
    buildProgressBar(percent, totalBlocks = 10) {
        const filledBlocks = Math.round((percent / 100) * totalBlocks);
        const emptyBlocks = totalBlocks - filledBlocks;
        return '█'.repeat(filledBlocks) + '░'.repeat(Math.max(0, emptyBlocks));
    }

    /**
     * Create a new poll structure
     */
    createPoll({ question, options, authorId, guildId, channelId }) {
        const poll = {
            id: null,
            question,
            options: options.map((opt, idx) => ({
                index: idx,
                label: opt,
                voters: new Set()
            })),
            authorId,
            guildId,
            channelId,
            createdAt: Date.now()
        };
        return poll;
    }

    registerPoll(messageId, poll) {
        poll.id = messageId;
        this.polls.set(messageId, poll);
    }

    /**
     * Handle button vote
     */
    handleVote(messageId, userId, optionIndex) {
        const poll = this.polls.get(messageId);
        if (!poll) return { success: false, reason: 'Poll session not found or expired.' };

        const targetOption = poll.options.find(o => o.index === optionIndex);
        if (!targetOption) return { success: false, reason: 'Invalid poll option.' };

        // Check if user previously voted on ANY option
        let previousOption = null;
        for (const opt of poll.options) {
            if (opt.voters.has(userId)) {
                previousOption = opt;
                opt.voters.delete(userId);
            }
        }

        // If clicking the same option they already selected, remove vote (toggle)
        if (previousOption && previousOption.index === optionIndex) {
            return {
                success: true,
                action: 'removed',
                option: targetOption.label,
                poll
            };
        }

        // Add vote to new selection
        targetOption.voters.add(userId);

        return {
            success: true,
            action: previousOption ? 'changed' : 'voted',
            option: targetOption.label,
            poll
        };
    }

    /**
     * Build rich embed representing poll state with live percentages and progress bars
     */
    buildPollEmbed(poll) {
        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voters.size, 0);

        const embed = new EmbedBuilder()
            .setColor(config.bot.colors.primary)
            .setTitle(`📊 ${poll.question}`)
            .setFooter({ text: `ChathuX Polls • Total Votes: ${totalVotes}` })
            .setTimestamp(new Date(poll.createdAt));

        const optionDescriptions = poll.options.map(opt => {
            const count = opt.voters.size;
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const bar = this.buildProgressBar(percentage, 10);
            return `**${opt.label}**\n\`${bar}\` **${percentage}%** (${count} ${count === 1 ? 'vote' : 'votes'})`;
        });

        embed.setDescription(
            `Asked by <@${poll.authorId}>\nClick the buttons below to cast or toggle your vote!\n\n` +
            optionDescriptions.join('\n\n')
        );

        return embed;
    }

    /**
     * Build ActionRows containing choice buttons
     */
    buildButtonRows(poll) {
        const buttons = poll.options.map(opt => {
            const btn = new ButtonBuilder()
                .setCustomId(`poll_vote_${poll.id || 'temp'}_${opt.index}`)
                .setLabel(`${opt.label} (${opt.voters.size})`)
                .setStyle(ButtonStyle.Secondary);

            if (opt.label.toLowerCase().includes('yes')) btn.setStyle(ButtonStyle.Success);
            else if (opt.label.toLowerCase().includes('no')) btn.setStyle(ButtonStyle.Danger);

            return btn;
        });

        // Split into rows of max 5 buttons
        const rows = [];
        for (let i = 0; i < buttons.length; i += 5) {
            rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
        }
        return rows;
    }
}

module.exports = new PollService();
