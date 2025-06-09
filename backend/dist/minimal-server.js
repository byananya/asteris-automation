"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var app = (0, express_1.default)();
var port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
// Simple health check
app.get('/healthz', function (req, res) {
    console.log('Health check called');
    res.status(200).send('OK');
});
// Basic route
app.get('/', function (req, res) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Start server
app.listen(port, '0.0.0.0', function () {
    console.log("Minimal server running on port ".concat(port));
    console.log('Environment variables:', {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DB_HOST: process.env.DB_HOST ? 'set' : 'not set'
    });
});
// Handle uncaught exceptions
process.on('uncaughtException', function (error) {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', function (reason, promise) {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
