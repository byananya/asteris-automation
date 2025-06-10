import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import intentRouter from './api/routes/intentRouter.js';
import stripeReconciliationRoutes from './routes/stripeReconciliationRoutes.js';
import emailSignupRouter from './routes/emailSignup.js';

const app = express();
const port = process.env.PORT || 3002;

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes - THESE MUST BE DEFINED BEFORE ANY STATIC FILE SERVING OR CATCH-ALL ROUTES
app.use('/api/intent', intentRouter);
app.use('/api/reconcile', stripeReconciliationRoutes);
app.use('/api/email-signup', emailSignupRouter);

// Serve static frontend files if they exist in the expected location
const frontendPath = path.join(__dirname, '../frontend');
console.log(`Looking for frontend files at: ${frontendPath}`);

try {
  // Serve static files
  app.use(express.static(frontendPath));
  
  // Handle root path and all frontend routes
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // For all other routes, serve the index.html
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
  
  console.log('Frontend static files are being served');
} catch (error) {
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
