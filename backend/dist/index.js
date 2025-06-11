"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const intentRouter_1 = __importDefault(require("./api/routes/intentRouter"));
const stripeReconciliationRoutes_1 = __importDefault(require("./routes/stripeReconciliationRoutes"));
const emailSignup_1 = __importDefault(require("./routes/emailSignup"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3002;
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
console.log(`Looking for frontend files at: ${frontendPath}`);
try {
    // Serve static files
    app.use(express_1.default.static(frontendPath));
    // Handle root path and all frontend routes
    app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        // For all other routes, serve the index.html
        res.sendFile(path_1.default.join(frontendPath, 'index.html'));
    });
    console.log('Frontend static files are being served');
}
catch (error) {
    console.error('Error setting up frontend static files:', error);
    // Fallback route handler for root path
    app.get('/', (req, res) => {
        res.send('Backend API is running. Frontend is not available.');
    });
}
// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION:', error.stack || error.message);
    // Don't exit the process in development to allow for debugging
    // In production, you would typically exit here: process.exit(1);
});
//# sourceMappingURL=index.js.map