const { ActivityType, Events } = require('discord.js');
const logger = require('../utils/logger');
const db = require('../database/connection');
const { config } = require('../config/config');

module.exports = {
    name: Events.ClientReady || 'clientReady',
    once: true,
    async execute(client) {
        const serverCount = client.guilds.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
        const commandCount = client.commands.size;
        const dbStatus = db.isConnected ? 'CONNECTED' : 'FALLBACK';

        // Display professional startup banner
        logger.startupBanner({
            status: 'ONLINE',
            servers: serverCount,
            users: totalUsers,
            commands: commandCount,
            db: dbStatus,
            dashboard: config.dashboard.url
        });

        // Dynamic activity rotator
        const activities = [
            { name: `${serverCount} servers | /help`, type: ActivityType.Watching },
            { name: 'AI Assistance | /ask', type: ActivityType.Playing },
            { name: 'High-Fi Tunes | /play', type: ActivityType.Listening },
            { name: 'Securing Communities | ChathuX', type: ActivityType.Custom }
        ];

        let activityIndex = 0;
        if (activities[0]) {
            client.user.setPresence({
                activities: [activities[0]],
                status: 'online'
            });
        }

        setInterval(() => {
            activityIndex = (activityIndex + 1) % activities.length;
            client.user.setPresence({
                activities: [activities[activityIndex]],
                status: 'online'
            });
        }, 30000);
    }
};
