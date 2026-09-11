const db = require('../connection');

class EconomyRepository {
    async getAccount(guildId, userId) {
        const key = `${guildId}:${userId}`;
        if (!db.isConnected) {
            let account = db.inMemoryStore.economy.get(key);
            if (!account) {
                account = {
                    guild_id: guildId,
                    user_id: userId,
                    balance: 1000,
                    bank: 0,
                    streak: 0,
                    last_daily: null,
                    last_work: null
                };
                db.inMemoryStore.economy.set(key, account);
            }
            return account;
        }

        const rows = await db.query(
            'SELECT * FROM economy_accounts WHERE guild_id = ? AND user_id = ?',
            [guildId, userId]
        );
        if (rows && rows.length > 0) {
            return rows[0];
        }

        await db.query(
            'INSERT INTO economy_accounts (guild_id, user_id, balance, bank, streak, last_daily, last_work) VALUES (?, ?, 1000, 0, 0, NULL, NULL)',
            [guildId, userId]
        );
        return { guild_id: guildId, user_id: userId, balance: 1000, bank: 0, streak: 0, last_daily: null, last_work: null };
    }

    async updateBalance(guildId, userId, walletDelta, bankDelta = 0) {
        const key = `${guildId}:${userId}`;
        if (!db.isConnected) {
            const acc = await this.getAccount(guildId, userId);
            acc.balance += walletDelta;
            acc.bank += bankDelta;
            db.inMemoryStore.economy.set(key, acc);
            return acc;
        }

        await db.query(
            'UPDATE economy_accounts SET balance = balance + ?, bank = bank + ? WHERE guild_id = ? AND user_id = ?',
            [walletDelta, bankDelta, guildId, userId]
        );
        return await this.getAccount(guildId, userId);
    }

    async claimDaily(guildId, userId, amount, streak) {
        const key = `${guildId}:${userId}`;
        if (!db.isConnected) {
            const acc = await this.getAccount(guildId, userId);
            acc.balance += amount;
            acc.streak = streak;
            acc.last_daily = new Date();
            db.inMemoryStore.economy.set(key, acc);
            return acc;
        }

        await db.query(
            'UPDATE economy_accounts SET balance = balance + ?, streak = ?, last_daily = NOW() WHERE guild_id = ? AND user_id = ?',
            [amount, streak, guildId, userId]
        );
        return await this.getAccount(guildId, userId);
    }

    async claimWork(guildId, userId, amount) {
        const key = `${guildId}:${userId}`;
        if (!db.isConnected) {
            const acc = await this.getAccount(guildId, userId);
            acc.balance += amount;
            acc.last_work = new Date();
            db.inMemoryStore.economy.set(key, acc);
            return acc;
        }

        await db.query(
            'UPDATE economy_accounts SET balance = balance + ?, last_work = NOW() WHERE guild_id = ? AND user_id = ?',
            [amount, guildId, userId]
        );
        return await this.getAccount(guildId, userId);
    }

    async transfer(guildId, senderId, receiverId, amount) {
        if (!db.isConnected) {
            const sender = await this.getAccount(guildId, senderId);
            const receiver = await this.getAccount(guildId, receiverId);
            if (sender.balance < amount) return { success: false, reason: 'Insufficient funds' };

            sender.balance -= amount;
            receiver.balance += amount;
            return { success: true };
        }

        return await db.transaction(async (conn) => {
            const [rows] = await conn.execute(
                'SELECT balance FROM economy_accounts WHERE guild_id = ? AND user_id = ? FOR UPDATE',
                [guildId, senderId]
            );
            if (!rows || rows.length === 0 || rows[0].balance < amount) {
                return { success: false, reason: 'Insufficient balance' };
            }

            // Ensure receiver account exists
            await conn.execute(
                'INSERT INTO economy_accounts (guild_id, user_id, balance, bank) VALUES (?, ?, 1000, 0) ON DUPLICATE KEY UPDATE guild_id=guild_id',
                [guildId, receiverId]
            );

            await conn.execute(
                'UPDATE economy_accounts SET balance = balance - ? WHERE guild_id = ? AND user_id = ?',
                [amount, guildId, senderId]
            );

            await conn.execute(
                'UPDATE economy_accounts SET balance = balance + ? WHERE guild_id = ? AND user_id = ?',
                [amount, guildId, receiverId]
            );

            await conn.execute(
                'INSERT INTO transactions (guild_id, sender_id, receiver_id, amount, type, description) VALUES (?, ?, ?, ?, "TRANSFER", "User peer transfer")',
                [guildId, senderId, receiverId, amount]
            );

            return { success: true };
        });
    }

    async getLeaderboard(guildId, limit = 10) {
        if (!db.isConnected) {
            return Array.from(db.inMemoryStore.economy.values())
                .filter(a => a.guild_id === guildId)
                .sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank))
                .slice(0, limit);
        }

        return await db.query(
            'SELECT *, (balance + bank) AS net_worth FROM economy_accounts WHERE guild_id = ? ORDER BY net_worth DESC LIMIT ?',
            [guildId, limit]
        );
    }

    async getShopItems(guildId) {
        if (!db.isConnected) {
            const defaultItems = [
                { id: 1, guild_id: guildId, name: 'VIP Pass', description: 'Gives the VIP status role', price: 5000, stock: -1 },
                { id: 2, guild_id: guildId, name: 'Crown', description: 'A shiny collectible server crown', price: 15000, stock: 5 },
                { id: 3, guild_id: guildId, name: 'Lucky Clover', description: 'Increases work rewards luck', price: 2500, stock: -1 }
            ];
            return defaultItems;
        }

        return await db.query('SELECT * FROM shop_items WHERE guild_id = ? ORDER BY price ASC', [guildId]);
    }

    async getInventory(guildId, userId) {
        if (!db.isConnected) {
            return [];
        }

        return await db.query(
            `SELECT i.id, i.item_id, i.quantity, i.acquired_at, s.name, s.description, s.price 
            FROM inventory i 
            JOIN shop_items s ON i.item_id = s.id 
            WHERE i.guild_id = ? AND i.user_id = ?`,
            [guildId, userId]
        );
    }
}

module.exports = new EconomyRepository();
