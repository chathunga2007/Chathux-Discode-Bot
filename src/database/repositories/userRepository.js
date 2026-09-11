const db = require('../connection');

class UserRepository {
    async getOrCreate(userId, username, discriminator = '0', avatar = null) {
        if (!db.isConnected) {
            let user = db.inMemoryStore.users.get(userId);
            if (!user) {
                user = { id: userId, username, discriminator, avatar, created_at: new Date() };
                db.inMemoryStore.users.set(userId, user);
            }
            return user;
        }

        const rows = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (rows && rows.length > 0) {
            return rows[0];
        }

        await db.query(
            'INSERT INTO users (id, username, discriminator, avatar) VALUES (?, ?, ?, ?)',
            [userId, username, discriminator, avatar]
        );
        return { id: userId, username, discriminator, avatar };
    }
}

module.exports = new UserRepository();
