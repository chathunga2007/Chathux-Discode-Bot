const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function loadEvents(client) {
    const eventsPath = path.join(__dirname, '../events');
    if (!fs.existsSync(eventsPath)) {
        logger.warn(`Events directory does not exist at ${eventsPath}`, 'EVENT_HANDLER');
        return;
    }

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        try {
            const event = require(filePath);
            if (!event.name || !event.execute) {
                logger.warn(`Event ${file} is missing "name" or "execute".`, 'EVENT_HANDLER');
                continue;
            }

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }

            logger.debug(`Registered event: ${event.name}`, 'EVENT_HANDLER');
        } catch (err) {
            logger.error(`Failed to load event ${file}`, err, 'EVENT_HANDLER');
        }
    }

    logger.success(`Successfully registered ${eventFiles.length} gateway events.`, 'EVENT_HANDLER');
}

module.exports = {
    loadEvents
};
