const db = require('../connection');

class ModerationRepository {
    async addWarning(guildId, userId, moderatorId, reason) {
        if (!db.isConnected) {
            const warning = {
                id: db.inMemoryStore.warnings.length + 1,
                guild_id: guildId,
                user_id: userId,
                moderator_id: moderatorId,
                reason,
                created_at: new Date()
            };
            db.inMemoryStore.warnings.push(warning);
            return warning;
        }

        const result = await db.query(
            'INSERT INTO warnings (guild_id, user_id, moderator_id, reason) VALUES (?, ?, ?, ?)',
            [guildId, userId, moderatorId, reason]
        );
        return { id: result.insertId, guild_id: guildId, user_id: userId, moderator_id: moderatorId, reason };
    }

    async getWarnings(guildId, userId) {
        if (!db.isConnected) {
            return db.inMemoryStore.warnings.filter(w => w.guild_id === guildId && w.user_id === userId);
        }

        return await db.query(
            'SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC',
            [guildId, userId]
        );
    }

    async clearWarnings(guildId, userId) {
        if (!db.isConnected) {
            db.inMemoryStore.warnings = db.inMemoryStore.warnings.filter(w => !(w.guild_id === guildId && w.user_id === userId));
            return true;
        }

        await db.query('DELETE FROM warnings WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
        return true;
    }

    async logAction(guildId, userId, moderatorId, action, reason, durationSeconds = null) {
        if (!db.isConnected) {
            const entry = {
                id: db.inMemoryStore.moderation_logs.length + 1,
                guild_id: guildId,
                user_id: userId,
                moderator_id: moderatorId,
                action,
                reason,
                duration_seconds: durationSeconds,
                created_at: new Date()
            };
            db.inMemoryStore.moderation_logs.push(entry);
            return entry;
        }

        const result = await db.query(
            'INSERT INTO moderation_logs (guild_id, user_id, moderator_id, action, reason, duration_seconds) VALUES (?, ?, ?, ?, ?, ?)',
            [guildId, userId, moderatorId, action, reason, durationSeconds]
        );
        return { id: result.insertId, guild_id: guildId, user_id: userId, action, reason };
    }

    async getLogs(guildId, limit = 20) {
        if (!db.isConnected) {
            return db.inMemoryStore.moderation_logs
                .filter(l => l.guild_id === guildId)
                .slice(-limit)
                .reverse();
        }

        return await db.query(
            'SELECT * FROM moderation_logs WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?',
            [guildId, limit]
        );
    }

    async getSettings(guildId) {
        if (!db.isConnected) {
            return {
                guild_id: guildId,
                anti_spam: 1,
                anti_flood: 1,
                anti_mention: 1,
                max_mentions: 4,
                filter_bad_words: 1,
                filter_links: 0,
                raid_protection: 0,
                auto_timeout_strikes: 3
            };
        }

        const rows = await db.query('SELECT * FROM moderation_settings WHERE guild_id = ?', [guildId]);
        if (rows && rows.length > 0) return rows[0];

        await db.query(
            `INSERT INTO moderation_settings 
            (guild_id, anti_spam, anti_flood, anti_mention, max_mentions, filter_bad_words, filter_links, raid_protection, auto_timeout_strikes)
            VALUES (?, 1, 1, 1, 4, 1, 0, 0, 3)`,
            [guildId]
        );

        return {
            guild_id: guildId,
            anti_spam: 1,
            anti_flood: 1,
            anti_mention: 1,
            max_mentions: 4,
            filter_bad_words: 1,
            filter_links: 0,
            raid_protection: 0,
            auto_timeout_strikes: 3
        };
    }

    async updateSettings(guildId, newSettings) {
        if (!db.isConnected) return { guild_id: guildId, ...newSettings };

        const fields = [];
        const values = [];
        for (const [k, v] of Object.entries(newSettings)) {
            fields.push(`${k} = ?`);
            values.push(v);
        }
        if (fields.length === 0) return await this.getSettings(guildId);

        values.push(guildId);
        await db.query(`UPDATE moderation_settings SET ${fields.join(', ')} WHERE guild_id = ?`, values);
        return await this.getSettings(guildId);
    }
}

module.exports = new ModerationRepository();
