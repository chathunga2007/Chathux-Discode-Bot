require('dotenv').config();
const db = require('../src/database/connection');
const { runMigrations } = require('../src/database/migrator');
const logger = require('../src/utils/logger');

async function main() {
    logger.info('Initializing ChathuX database...', 'DB_INIT');
    const connected = await db.init();
    if (!connected) {
        logger.error('Could not connect to MySQL. Ensure MySQL server is running and credentials in .env are correct.', null, 'DB_INIT');
        process.exit(1);
    }

    const success = await runMigrations();
    await db.close();

    if (success) {
        logger.success('Database initialization complete!', 'DB_INIT');
        process.exit(0);
    } else {
        logger.error('Database migration failed.', null, 'DB_INIT');
        process.exit(1);
    }
}

main().catch(err => {
    logger.error('Unhandled database initialization error', err, 'DB_INIT');
    process.exit(1);
});
