const db = require('../connection');

class GuildRepository {
    async getOrCreate(guildId, name, icon = null, ownerId = '0') {
        if (!db.isConnected) {
            let guild = db.inMemoryStore.guilds.get(guildId);
            if (!guild) {
                guild = { id: guildId, name, icon, owner_id: ownerId, joined_at: new Date() };
                db.inMemoryStore.guilds.set(guildId, guild);
            }
            return guild;
        }

        const rows = await db.query('SELECT * FROM guilds WHERE id = ?', [guildId]);
        if (rows && rows.length > 0) {
            return rows[0];
        }

        await db.query(
            'INSERT INTO guilds (id, name, icon, owner_id, joined_at) VALUES (?, ?, ?, ?, NOW())',
            [guildId, name, icon, ownerId]
        );
        return { id: guildId, name, icon, owner_id: ownerId };
    }

    async getSettings(guildId) {
        if (!db.isConnected) {
            let settings = db.inMemoryStore.guild_settings.get(guildId);
            if (!settings) {
                settings = {
                    guild_id: guildId,
                    prefix: '!',
                    welcome_channel_id: null,
                    log_channel_id: null,
                    mod_channel_id: null,
                    ai_channel_id: null,
                    level_channel_id: null,
                    auto_role_id: null,
                    welcome_enabled: 0,
                    logging_enabled: 0,
                    mod_enabled: 1,
                    ai_enabled: 1,
                    leveling_enabled: 1,
                    economy_enabled: 1,
                    owner_only_mode: 0
                };
                db.inMemoryStore.guild_settings.set(guildId, settings);
            }
            return settings;
        }

        const rows = await db.query('SELECT * FROM guild_settings WHERE guild_id = ?', [guildId]);
        if (rows && rows.length > 0) {
            return rows[0];
        }

        // Insert defaults
        const defaults = [guildId, '!', null, null, null, null, null, null, 0, 0, 1, 1, 1, 1, 0];
        await db.query(
            `INSERT INTO guild_settings 
            (guild_id, prefix, welcome_channel_id, log_channel_id, mod_channel_id, ai_channel_id, level_channel_id, auto_role_id, welcome_enabled, logging_enabled, mod_enabled, ai_enabled, leveling_enabled, economy_enabled, owner_only_mode)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            defaults
        );

        return {
            guild_id: guildId,
            prefix: '!',
            welcome_channel_id: null,
            log_channel_id: null,
            mod_channel_id: null,
            ai_channel_id: null,
            level_channel_id: null,
            auto_role_id: null,
            welcome_enabled: 0,
            logging_enabled: 0,
            mod_enabled: 1,
            ai_enabled: 1,
            leveling_enabled: 1,
            economy_enabled: 1,
            owner_only_mode: 0
        };
    }

    async updateSettings(guildId, newSettings) {
        if (!db.isConnected) {
            const current = await this.getSettings(guildId);
            const updated = { ...current, ...newSettings };
            db.inMemoryStore.guild_settings.set(guildId, updated);
            return updated;
        }

        const fields = [];
        const values = [];

        for (const [key, val] of Object.entries(newSettings)) {
            fields.push(`${key} = ?`);
            values.push(val);
        }

        if (fields.length === 0) return await this.getSettings(guildId);

        values.push(guildId);
        await db.query(`UPDATE guild_settings SET ${fields.join(', ')} WHERE guild_id = ?`, values);
        return await this.getSettings(guildId);
    }
}

module.exports = new GuildRepository();
