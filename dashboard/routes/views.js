const express = require('express');
const path = require('path');
const router = express.Router();

// Landing page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

// Global dashboard analytics
router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

// Server selection page
router.get('/servers', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/servers.html'));
});

// Guild management dashboard
router.get('/server/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/server-manage.html'));
});

router.get('/server/:id/:tab', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/server-manage.html'));
});

module.exports = router;
