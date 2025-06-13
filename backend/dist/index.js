"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const intentRouter_1 = __importDefault(require("./api/routes/intentRouter"));
const stripeReconciliationRoutes_1 = __importDefault(require("./routes/stripeReconciliationRoutes"));
const emailSignup_1 = __importDefault(require("./routes/emailSignup"));
const winston_1 = require("winston");
// Configure logger
const logger = (0, winston_1.createLogger)({
    level: 'info',
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
    transports: [
        new winston_1.transports.Console(),
        new winston_1.transports.File({ filename: 'error.log', level: 'error' }),
        new winston_1.transports.File({ filename: 'combined.log' })
    ]
});
const app = (0, express_1.default)();
const port = process.env.PORT || 3002;
// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Log uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});
// Get __dirname equivalent in ESM
// In CommonJS, __dirname is available by default
// CORS configuration
const corsOptions = {
    origin: 'http://localhost:3000', // Frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-stripe-key'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
};
// Middleware
app.use((0, cors_1.default)(corsOptions));
// Handle preflight requests
app.options('*', (0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes - THESE MUST BE DEFINED BEFORE ANY STATIC FILE SERVING OR CATCH-ALL ROUTES
app.use('/api/intent', intentRouter_1.default);
app.use('/api/reconcile', stripeReconciliationRoutes_1.default);
app.use('/api/email-signup', emailSignup_1.default);
// Serve static frontend files if they exist in the expected location
const frontendPath = path_1.default.join(__dirname, '../frontend');
const frontendExists = fs_1.default.existsSync(frontendPath);
logger.info(`Looking for frontend files at: ${frontendPath}`);
logger.info(`Frontend directory exists: ${frontendExists}`);
// Serve static files if they exist
if (frontendExists) {
    logger.info('Serving static files from:', frontendPath);
    app.use(express_1.default.static(frontendPath));
    // Handle SPA routing - serve index.html for all other routes
    app.get('*', (req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
            return next();
        }
        // For all other routes, serve the frontend's index.html
        res.sendFile(path_1.default.join(frontendPath, 'index.html'), (err) => {
            if (err) {
                logger.error('Error sending file:', err);
                res.status(500).json({
                    status: 'error',
                    message: 'Error loading the application',
                    error: process.env.NODE_ENV === 'development' ? err.message : undefined
                });
            }
        });
    });
}
else {
    logger.warn('Frontend files not found. Only API routes will be available.');
    // Basic route for the root path
    app.get('/', (req, res) => {
        res.json({
            status: 'backend-only',
            message: 'Backend is running but no frontend files were found.',
            timestamp: new Date().toISOString()
        });
    });
}
// Start the server
const server = app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    // Log all environment variables (except sensitive ones) for debugging
    const envVars = Object.keys(process.env)
        .filter(key => !key.toLowerCase().includes('key') &&
        !key.toLowerCase().includes('secret') &&
        !key.toLowerCase().includes('password'))
        .reduce((obj, key) => {
        obj[key] = process.env[key];
        return obj;
    }, {});
    logger.debug('Environment variables:', envVars);
});
// Handle server errors
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    // Handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            logger.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
});
// Handle process termination
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});
// Global error handler for uncaught exceptions
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION:', error.stack || error.message);
    // Don't exit the process in development to allow for debugging
    // In production, you would typically exit here: process.exit(1);
});
//# sourceMappingURL=index.js.map