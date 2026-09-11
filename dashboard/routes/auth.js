const express = require('express');
const axios = require('axios');
const router = express.Router();
const { config } = require('../../src/config/config');
const logger = require('../../src/utils/logger');

const DISCORD_API = 'https://discord.com/api/v10';

/**
 * Initiates Discord OAuth2 Login (with fallback to Demo Mode if secret not yet provided)
 */
router.get('/login', (req, res) => {
    if (!config.dashboard.clientSecret) {
        logger.info('OAuth2 secret not configured. Redirecting to Instant Demo Mode...', 'AUTH');
        return res.redirect('/api/auth/demo?notice=setup_required');
    }

    const params = new URLSearchParams({
        client_id: config.bot.clientId,
        redirect_uri: config.dashboard.redirectUri,
        response_type: 'code',
        scope: 'identify guilds'
    });

    res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

/**
 * Instant Demo Admin Mode
 * Allows developers and testers to immediately explore, configure, and test all dashboard pages.
 */
router.get('/demo', (req, res) => {
    req.session.user = {
        id: '1548035152637329428',
        username: 'ChathuX Developer',
        discriminator: '0001',
        avatar: null,
        isDemo: true
    };

    req.session.guilds = [
        {
            id: '112233445566778899',
            name: '🔥 ChathuX Community HQ',
            icon: null,
            permissions: '8', // Administrator
            botInGuild: true
        },
        {
            id: '998877665544332211',
            name: '⚡ Cyber Elite Realm',
            icon: null,
            permissions: '32', // Manage Server
            botInGuild: true
        }
    ];

    logger.info('Developer Demo Admin session initialized', 'AUTH');
    res.redirect('/servers');
});

/**
 * OAuth2 Callback Endpoint
 */
router.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.redirect('/?error=missing_code');
    }

    try {
        // Exchange code for access token
        const tokenRes = await axios.post(
            `${DISCORD_API}/oauth2/token`,
            new URLSearchParams({
                client_id: config.bot.clientId,
                client_secret: config.dashboard.clientSecret,
                grant_type: 'authorization_code',
                code,
                redirect_uri: config.dashboard.redirectUri
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const { access_token, token_type } = tokenRes.data;

        // Fetch User Profile
        const userRes = await axios.get(`${DISCORD_API}/users/@me`, {
            headers: { Authorization: `${token_type} ${access_token}` }
        });

        // Fetch User Guilds
        const guildsRes = await axios.get(`${DISCORD_API}/users/@me/guilds`, {
            headers: { Authorization: `${token_type} ${access_token}` }
        });

        // Store in session
        req.session.user = userRes.data;
        req.session.guilds = guildsRes.data;
        req.session.accessToken = access_token;

        logger.info(`User ${userRes.data.username} logged into dashboard via Discord OAuth2`, 'DASHBOARD_AUTH');
        res.redirect('/servers');
    } catch (error) {
        logger.error('OAuth2 callback error', error.response?.data || error.message, 'DASHBOARD_AUTH');
        res.redirect('/api/auth/demo?notice=auth_fallback');
    }
});

/**
 * Log Out
 */
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

/**
 * Return currently authenticated user
 */
router.get('/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ authenticated: false });
    }
    res.json({
        authenticated: true,
        user: req.session.user,
        isDemo: !!req.session.user.isDemo
    });
});

module.exports = router;
