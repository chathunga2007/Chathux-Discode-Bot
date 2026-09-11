require('dotenv').config();

const config = {
    bot: {
        token: process.env.DISCORD_TOKEN || '',
        clientId: process.env.CLIENT_ID || '',
        ownerId: process.env.OWNER_ID || '',
        ownerOnly: (process.env.OWNER_ONLY_MODE || 'false').toLowerCase() === 'true',
        defaultPrefix: process.env.DEFAULT_PREFIX || '!',
        colors: {
            primary: process.env.DEFAULT_EMBED_COLOR || '#7C3AED',
            secondary: '#06B6D4',
            success: '#10B981',
            danger: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6',
            dark: '#111827'
        }
    },
    database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
        user: process.env.DATABASE_USER || 'root',
        password: process.env.DATABASE_PASSWORD || '',
        database: process.env.DATABASE_NAME || 'chathux_db',
        connectionLimit: 10
    },
    dashboard: {
        port: parseInt(process.env.PORT, 10) || 3000,
        sessionSecret: process.env.SESSION_SECRET || 'chathux_default_session_secret_change_me',
        clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
        redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
        url: process.env.DASHBOARD_URL || 'http://localhost:3000'
    },
    ai: {
        provider: (process.env.AI_PROVIDER || 'fallback').toLowerCase(),
        apiKey: process.env.AI_API_KEY || '',
        model: process.env.AI_MODEL || 'gemini-1.5-flash',
        maxContextLength: 10
    },
    system: {
        nodeEnv: process.env.NODE_ENV || 'development',
        isDev: (process.env.NODE_ENV || 'development') === 'development'
    }
};

/**
 * Validate essential bot configurations
 */
function validateConfig() {
    const warnings = [];
    if (!config.bot.token) {
        warnings.push('DISCORD_TOKEN is not set in .env.');
    }
    if (!config.bot.clientId) {
        warnings.push('CLIENT_ID is not set in .env.');
    }
    if (!config.dashboard.clientSecret) {
        warnings.push('DISCORD_CLIENT_SECRET is not set. Dashboard OAuth2 login will be disabled until configured.');
    }
    return warnings;
}

module.exports = {
    config,
    validateConfig
};
