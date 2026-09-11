/**
 * ChathuX Multi-Service Master Entrypoint
 * Bootstraps Discord Bot Client, Express Dashboard API, and MySQL Connection Pool.
 */

require('dotenv').config();
const { validateConfig, config } = require('./src/config/config');
const logger = require('./src/utils/logger');
const db = require('./src/database/connection');
const { runMigrations } = require('./src/database/migrator');
const { startBot, client } = require('./src/bot');
const { startDashboardServer } = require('./dashboard/server');

// Process Error Safety Nets
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection detected', reason, 'FATAL');
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception detected', error, 'FATAL');
});

async function bootstrap() {
    logger.info('Initializing ChathuX Platform...', 'BOOT');

    // 1. Validate Configuration
    const warnings = validateConfig();
    warnings.forEach(w => logger.warn(w, 'CONFIG'));

    // 2. Initialize Database Layer
    const dbConnected = await db.init();
    if (dbConnected) {
        await runMigrations();
    }

    // 3. Launch Express Web Dashboard & REST API
    let dashboardServer = null;
    try {
        dashboardServer = await startDashboardServer(config.dashboard.port);
    } catch (apiError) {
        logger.error('Failed to start Dashboard Web Server', apiError, 'DASHBOARD');
    }

    // 4. Launch Discord Bot Client
    const botStarted = await startBot();
    if (!botStarted) {
        logger.warn('Discord Bot login deferred. Verify DISCORD_TOKEN in .env file.', 'BOT_CORE');
    }

    // 5. Graceful Shutdown Routine
    const shutdown = async (signal) => {
        logger.info(`Received ${signal}. Gracefully terminating ChathuX...`, 'SYSTEM');

        try {
            if (client && client.isReady()) {
                client.destroy();
                logger.info('Discord client destroyed.', 'SYSTEM');
            }
            if (dashboardServer) {
                dashboardServer.close();
                logger.info('Dashboard web server stopped.', 'SYSTEM');
            }
            await db.close();
        } catch (shutdownErr) {
            logger.error('Error during graceful shutdown', shutdownErr, 'SYSTEM');
        }

        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch(err => {
    logger.error('Failed to bootstrap ChathuX platform', err, 'BOOTSTRAP');
    process.exit(1);
});