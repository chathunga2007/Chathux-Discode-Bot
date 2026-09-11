const db = require('../connection');

class AIRepository {
    async getOrCreateConversation(guildId, channelId, userId) {
        if (!db.isConnected) {
            return { id: 1, guild_id: guildId, channel_id: channelId, user_id: userId };
        }

        const rows = await db.query(
            'SELECT * FROM ai_conversations WHERE channel_id = ? AND user_id = ?',
            [channelId, userId]
        );

        if (rows && rows.length > 0) {
            return rows[0];
        }

        const res = await db.query(
            'INSERT INTO ai_conversations (guild_id, channel_id, user_id) VALUES (?, ?, ?)',
            [guildId, channelId, userId]
        );
        return { id: res.insertId, guild_id: guildId, channel_id: channelId, user_id: userId };
    }

    async addMessage(conversationId, role, content) {
        if (!db.isConnected) return;

        await db.query(
            'INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, ?, ?)',
            [conversationId, role, content]
        );
    }

    async getRecentMessages(conversationId, limit = 6) {
        if (!db.isConnected) return [];

        const rows = await db.query(
            'SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?',
            [conversationId, limit]
        );
        return (rows || []).reverse();
    }

    async clearConversation(channelId, userId) {
        if (!db.isConnected) return true;

        const conv = await db.query(
            'SELECT id FROM ai_conversations WHERE channel_id = ? AND user_id = ?',
            [channelId, userId]
        );
        if (conv && conv.length > 0) {
            await db.query('DELETE FROM ai_messages WHERE conversation_id = ?', [conv[0].id]);
        }
        return true;
    }
}

module.exports = new AIRepository();
