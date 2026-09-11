const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const logger = require('../utils/logger');

function loadCommands(client) {
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, '../commands');
    
    if (!fs.existsSync(commandsPath)) {
        logger.warn(`Commands directory does not exist at ${commandsPath}`, 'COMMAND_HANDLER');
        return;
    }

    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        if (!fs.statSync(folderPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            try {
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    logger.debug(`Loaded slash command: /${command.data.name} [${folder}]`, 'COMMANDS');
                } else {
                    logger.warn(`Command at ${filePath} is missing required "data" or "execute" property.`, 'COMMAND_HANDLER');
                }
            } catch (err) {
                logger.error(`Error loading command file ${file}`, err, 'COMMAND_HANDLER');
            }
        }
    }

    logger.success(`Successfully loaded ${client.commands.size} slash commands.`, 'COMMAND_HANDLER');
}

/**
 * Returns serializable JSON array of all registered slash commands
 */
function getAllCommandsData() {
    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    if (!fs.existsSync(commandsPath)) return commands;

    const commandFolders = fs.readdirSync(commandsPath);
    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        if (!fs.statSync(folderPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            try {
                const command = require(filePath);
                if (command.data && typeof command.data.toJSON === 'function') {
                    commands.push(command.data.toJSON());
                } else if (command.data) {
                    commands.push(command.data);
                }
            } catch (err) {
                logger.error(`Failed to serialize command at ${filePath}`, err, 'COMMAND_DEPLOYER');
            }
        }
    }
    return commands;
}

module.exports = {
    loadCommands,
    getAllCommandsData
};
