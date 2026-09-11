const mysql = require('mysql2/promise');
const { config } = require('../config/config');
const logger = require('../utils/logger');

class Database {
    constructor() {
        this.pool = null;
        this.isConnected = false;
        this.inMemoryStore = {
            guilds: new Map(),
            guild_settings: new Map(),
            users: new Map(),
            xp: new Map(),
            economy: new Map(),
            warnings: [],
            moderation_logs: [],
            shop_items: new Map()
        };
    }

    /**
     * Initializes the MySQL connection pool
     */
    async init() {
        try {
            this.pool = mysql.createPool({
                host: config.database.host,
                port: config.database.port,
                user: config.database.user,
                password: config.database.password,
                database: config.database.database,
                waitForConnections: true,
                connectionLimit: config.database.connectionLimit,
                queueLimit: 0,
                enableKeepAlive: true,
                keepAliveInitialDelay: 10000
            });

            // Test connection
            const connection = await this.pool.getConnection();
            connection.release();

            this.isConnected = true;
            logger.success(`Connected to MySQL database: ${config.database.database}`, 'DATABASE');
            return true;
        } catch (error) {
            this.isConnected = false;
            logger.warn(
                `MySQL connection could not be established (${error.message}). Running in safe in-memory fallback mode. Configure DATABASE_PASSWORD / host in .env when ready.`,
                'DATABASE'
            );
            return false;
        }
    }

    /**
     * Executes a parameterized query using prepared statements
     */
    async query(sql, params = []) {
        if (!this.isConnected || !this.pool) {
            return null;
        }

        try {
            const [results] = await this.pool.execute(sql, params);
            return results;
        } catch (error) {
            logger.error(`Database query failed: ${sql}`, error, 'DATABASE');
            throw error;
        }
    }

    /**
     * Executes multiple queries within an ACID transaction
     */
    async transaction(callback) {
        if (!this.isConnected || !this.pool) {
            return null;
        }

        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            logger.error('Database transaction rolled back', error, 'DATABASE');
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Gracefully closes pool on process shutdown
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            logger.info('MySQL connection pool closed gracefully', 'DATABASE');
        }
    }
}

const db = new Database();
module.exports = db;
