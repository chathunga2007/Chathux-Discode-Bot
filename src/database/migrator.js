const fs = require('fs');
const path = require('path');
const db = require('./connection');
const logger = require('../utils/logger');

/**
 * Runs SQL migrations from database/schema.sql
 */
async function runMigrations() {
    if (!db.isConnected) {
        logger.warn('Skipping migrations: Database is not connected.', 'MIGRATOR');
        return false;
    }

    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
        logger.error(`Schema file not found at ${schemaPath}`, null, 'MIGRATOR');
        return false;
    }

    try {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // Remove comments and split by semicolon
        const statements = schemaSql
            .replace(/--.*$/gm, '')
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        logger.info(`Executing ${statements.length} schema migration statements...`, 'MIGRATOR');

        for (const statement of statements) {
            // Skip USE or CREATE DATABASE if executed inside user-scoped connection
            if (/^CREATE DATABASE/i.test(statement) || /^USE/i.test(statement)) {
                continue;
            }
            await db.query(statement);
        }

        logger.success('Database schema migrations applied successfully!', 'MIGRATOR');
        return true;
    } catch (error) {
        logger.error('Failed to run database migrations', error, 'MIGRATOR');
        return false;
    }
}

module.exports = {
    runMigrations
};
