class AfkService {
    constructor() {
        // Map<`${guildId}:${userId}`, { reason: string, timestamp: number }>
        this.afkMap = new Map();
    }

    getKey(guildId, userId) {
        return `${guildId}:${userId}`;
    }

    setAfk(guildId, userId, reason = 'AFK') {
        const key = this.getKey(guildId, userId);
        const data = {
            reason: reason && reason.trim() ? reason.trim() : 'AFK',
            timestamp: Date.now()
        };
        this.afkMap.set(key, data);
        return data;
    }

    getAfk(guildId, userId) {
        const key = this.getKey(guildId, userId);
        return this.afkMap.get(key) || null;
    }

    clearAfk(guildId, userId) {
        const key = this.getKey(guildId, userId);
        const hadAfk = this.afkMap.get(key);
        if (hadAfk) {
            this.afkMap.delete(key);
            return hadAfk;
        }
        return null;
    }

    formatTimeAgo(timestamp) {
        const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
        if (diffSeconds < 60) return `${diffSeconds} second${diffSeconds === 1 ? '' : 's'} ago`;
        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
}

module.exports = new AfkService();
