require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { getAllCommandsData } = require('../src/handlers/commandHandler');
const { config } = require('../src/config/config');
const logger = require('../src/utils/logger');

async function deploy() {
    const token = config.bot.token;
    const clientId = config.bot.clientId;

    if (!token || !clientId) {
        logger.error('Cannot deploy slash commands: Missing DISCORD_TOKEN or CLIENT_ID in environment.', null, 'DEPLOY');
        process.exit(1);
    }

    const commands = getAllCommandsData();
    logger.info(`Started refreshing ${commands.length} application (/) commands...`, 'DEPLOY');

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        logger.success(`Successfully reloaded and registered ${data.length} global slash commands!`, 'DEPLOY');
        process.exit(0);
    } catch (error) {
        logger.error('Failed to register application slash commands', error, 'DEPLOY');
        process.exit(1);
    }
}

deploy();
