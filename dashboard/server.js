const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const { config } = require('../src/config/config');
const logger = require('../src/utils/logger');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const viewRoutes = require('./routes/views');

const app = express();

// Security and utility middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session handling
app.use(session({
    secret: config.dashboard.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.system.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// Serve static assets across all path conventions (Live Server & Express compatible)
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/dashboard/public', express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/', viewRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error('Dashboard internal error', err, 'DASHBOARD');
    res.status(500).json({ error: 'Internal Dashboard Server Error' });
});

function startDashboardServer(port = config.dashboard.port) {
    return new Promise((resolve) => {
        const server = app.listen(port, () => {
            logger.success(`ChathuX Web Dashboard running at http://localhost:${port}`, 'DASHBOARD');
            resolve(server);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                const nextPort = port + 1;
                logger.warn(`Port ${port} is currently in use. Falling back to port ${nextPort}...`, 'DASHBOARD');
                resolve(startDashboardServer(nextPort));
            } else {
                logger.error('Dashboard server encountered an error', err, 'DASHBOARD');
                resolve(null);
            }
        });
    });
}

module.exports = {
    app,
    startDashboardServer
};
