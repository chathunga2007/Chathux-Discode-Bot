const db = require('../connection');

class XPRepository {
    async getUserXP(guildId, userId) {
        const key = `${guildId}:${userId}`;
        if (!db.isConnected) {
            let data = db.inMemoryStore.xp.get(key);
            if (!data) {
                data = { guild_id: guildId, user_id: userId, xp: 0, level: 0, total_messages: 0, last_xp_gain: null };
                db.inMemoryStore.xp.set(key, data);
            }
            return data;
        }

        const rows = await db.query('SELECT * FROM xp WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
        if (rows && rows.length > 0) {
            return rows[0];
        }

        await db.query(
            'INSERT INTO xp (guild_id, user_id, xp, level, total_messages, last_xp_gain) VALUES (?, ?, 0, 0, 0, NULL)',
            [guildId, userId]
        );
        return { guild_id: guildId, user_id: userId, xp: 0, level: 0, total_messages: 0, last_xp_gain: null };
    }

    async addXP(guildId, userId, amount, newLevel = null) {
        const key = `${guildId}:${userId}`;
        const now = new Date();

        if (!db.isConnected) {
            let data = await this.getUserXP(guildId, userId);
            data.xp += amount;
            data.total_messages += 1;
            data.last_xp_gain = now;
            if (newLevel !== null) data.level = newLevel;
            db.inMemoryStore.xp.set(key, data);
            return data;
        }

        if (newLevel !== null) {
            await db.query(
                `UPDATE xp SET xp = xp + ?, level = ?, total_messages = total_messages + 1, last_xp_gain = NOW() 
                WHERE guild_id = ? AND user_id = ?`,
                [amount, newLevel, guildId, userId]
            );
        } else {
            await db.query(
                `UPDATE xp SET xp = xp + ?, total_messages = total_messages + 1, last_xp_gain = NOW() 
                WHERE guild_id = ? AND user_id = ?`,
                [amount, guildId, userId]
            );
        }

        return await this.getUserXP(guildId, userId);
    }

    async getLeaderboard(guildId, limit = 10) {
        if (!db.isConnected) {
            const list = Array.from(db.inMemoryStore.xp.values())
                .filter(x => x.guild_id === guildId)
                .sort((a, b) => b.xp - a.xp)
                .slice(0, limit);
            return list;
        }

        return await db.query(
            'SELECT * FROM xp WHERE guild_id = ? ORDER BY xp DESC LIMIT ?',
            [guildId, limit]
        );
    }

    async getUserRank(guildId, userId) {
        if (!db.isConnected) {
            const list = Array.from(db.inMemoryStore.xp.values())
                .filter(x => x.guild_id === guildId)
                .sort((a, b) => b.xp - a.xp);
            const index = list.findIndex(x => x.user_id === userId);
            return index !== -1 ? index + 1 : 1;
        }

        const user = await this.getUserXP(guildId, userId);
        const rows = await db.query(
            'SELECT COUNT(*) as higherRankCount FROM xp WHERE guild_id = ? AND xp > ?',
            [guildId, user.xp]
        );
        return (rows[0]?.higherRankCount || 0) + 1;
    }
}

module.exports = new XPRepository();
