const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { config } = require('./config/config');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const logger = require('./utils/logger');

function createDiscordClient(intents) {
    return new Client({
        intents,
        partials: [
            Partials.Message,
            Partials.Channel,
            Partials.Reaction,
            Partials.User,
            Partials.GuildMember
        ]
    });
}

// Default Full Intents (requires Privileged Intents toggled in Discord Developer Portal)
const fullIntents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions
];

// Fallback Standard Intents (works immediately without Privileged Intents enabled)
const standardIntents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions
];

let client = createDiscordClient(fullIntents);
loadCommands(client);
loadEvents(client);

async function startBot() {
    if (!config.bot.token) {
        logger.error('Cannot start Discord bot: DISCORD_TOKEN is missing from environment variables.', null, 'BOT_CORE');
        return false;
    }

    try {
        await client.login(config.bot.token);
        return true;
    } catch (error) {
        if (error.message && error.message.includes('disallowed intents')) {
            logger.warn(
                'Privileged Gateway Intents (Members/MessageContent/Presences) are not yet enabled in the Discord Developer Portal. Falling back to Standard Intents...',
                'BOT_CORE'
            );

            // Recreate with standard intents
            client = createDiscordClient(standardIntents);
            loadCommands(client);
            loadEvents(client);

            try {
                await client.login(config.bot.token);
                logger.success('Discord Bot connected successfully using Standard Gateway Intents!', 'BOT_CORE');
                return true;
            } catch (fallbackError) {
                logger.error('Failed to log in with standard intents', fallbackError, 'BOT_CORE');
                return false;
            }
        }

        logger.error('Failed to log in to Discord gateway', error, 'BOT_CORE');
        return false;
    }
}

module.exports = {
    get client() { return client; },
    startBot
};
