/**
 * ChathuX Enterprise Logging Utility
 * Supports formatted console output, ANSI styling, and structured logs.
 */

const ANSI = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
};

function formatTimestamp() {
    return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

const logger = {
    info(message, context = 'SYSTEM') {
        console.log(`${ANSI.gray}[${formatTimestamp()}]${ANSI.reset} ${ANSI.cyan}[${context}]${ANSI.reset} ${ANSI.blue}ℹ${ANSI.reset} ${message}`);
    },

    success(message, context = 'SYSTEM') {
        console.log(`${ANSI.gray}[${formatTimestamp()}]${ANSI.reset} ${ANSI.cyan}[${context}]${ANSI.reset} ${ANSI.green}✔${ANSI.reset} ${message}`);
    },

    warn(message, context = 'SYSTEM') {
        console.warn(`${ANSI.gray}[${formatTimestamp()}]${ANSI.reset} ${ANSI.cyan}[${context}]${ANSI.reset} ${ANSI.yellow}⚠ ${message}${ANSI.reset}`);
    },

    error(message, error = null, context = 'SYSTEM') {
        console.error(`${ANSI.gray}[${formatTimestamp()}]${ANSI.reset} ${ANSI.cyan}[${context}]${ANSI.reset} ${ANSI.red}✖ ${message}${ANSI.reset}`);
        if (error && error.stack) {
            console.error(`${ANSI.dim}${error.stack}${ANSI.reset}`);
        } else if (error) {
            console.error(`${ANSI.dim}${error}${ANSI.reset}`);
        }
    },

    debug(message, context = 'DEBUG') {
        if (process.env.NODE_ENV === 'development') {
            console.log(`${ANSI.gray}[${formatTimestamp()}] [${context}] [DEBUG] ${message}${ANSI.reset}`);
        }
    },

    startupBanner(stats) {
        const { status = 'ONLINE', servers = 0, users = 0, commands = 0, db = 'CONNECTED', dashboard = 'http://localhost:3000' } = stats;
        const line = '═'.repeat(38);
        console.log(`
${ANSI.cyan}╔${line}╗
║          ${ANSI.bright}${ANSI.magenta}ChathuX Platform${ANSI.reset}${ANSI.cyan}            ║
╠${line}╣
║ ${ANSI.white}Status       :${ANSI.reset} ${ANSI.green}${status.padEnd(23)}${ANSI.reset}${ANSI.cyan}║
║ ${ANSI.white}Servers      :${ANSI.reset} ${String(servers).padEnd(23)}${ANSI.cyan}║
║ ${ANSI.white}Users        :${ANSI.reset} ${String(users).padEnd(23)}${ANSI.cyan}║
║ ${ANSI.white}Commands     :${ANSI.reset} ${String(commands).padEnd(23)}${ANSI.cyan}║
║ ${ANSI.white}Database     :${ANSI.reset} ${(db === 'CONNECTED' ? ANSI.green : ANSI.yellow)}${db.padEnd(23)}${ANSI.reset}${ANSI.cyan}║
║ ${ANSI.white}Dashboard    :${ANSI.reset} ${dashboard.padEnd(23)}${ANSI.cyan}║
╚${line}╝${ANSI.reset}
`);
    }
};

module.exports = logger;
