import express from 'express';
import path from 'path';
import fs from 'fs';
import intentRouter from './api/routes/intentRouter';
import stripeReconciliationRoutes from './routes/stripeReconciliationRoutes';
import emailSignupRouter from './routes/emailSignup';
import { createLogger, format, transports } from 'winston';

// Configure logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});

const app = express();
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

// Import fileURLToPath for ESM compatibility
import { fileURLToPath } from 'url';

// CORS configuration - temporarily permissive for testing
const allowedOrigins = ['*']; // Allow all origins for testing

// Enable CORS logging for debugging
console.log('CORS Configuration:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- Allowed origins:', allowedOrigins);

// Custom CORS middleware
const customCors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const origin = req.headers.origin || '';
  
  // Log request details for debugging
  console.log('\n=== CORS Request ===');
  console.log('Origin:', origin);
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Headers:', req.headers);
  
  // Set CORS headers
  if (origin) {
    // Check if the origin is in the allowed list or matches the regex
    // Temporarily allow all origins
    const isAllowed = true;
    
    if (true) { // Temporarily allow all origins
      // Set CORS headers for all responses
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-stripe-key, x-requested-with');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        console.log('Handling OPTIONS preflight request');
        console.log('Request Headers:', req.headers);
        return res.status(204).send();
      }
      
      console.log('CORS: Allowing request from origin:', origin);
    } else {
      console.warn('CORS: Blocked request from origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      return res.status(403).json({ 
        error: 'Not allowed by CORS',
        requestedOrigin: origin,
        allowedOrigins: allowedOrigins
      });
    }
  }
  
  next();
};

// Apply CORS middleware
app.use(customCors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  try {
    // Check if frontend files exist in production
    if (process.env.NODE_ENV === 'production' && frontendExists) {
      const indexPath = path.join(frontendPath, 'index.html');
      if (!fs.existsSync(indexPath)) {
        return res.status(500).json({
          status: 'error',
          message: 'Frontend index.html not found',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Add database health check if needed
    // Example: await checkDatabaseConnection();
    
    // If all checks pass
    res.status(200).json({
      status: 'ok',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes - THESE MUST BE DEFINED BEFORE ANY STATIC FILE SERVING OR CATCH-ALL ROUTES
app.use('/api/intent', intentRouter);
app.use('/api/reconcile', stripeReconciliationRoutes);
app.use('/api/email-signup', emailSignupRouter);

// Serve static frontend files if they exist in the expected location
let frontendPath: string = '';
let frontendExists: boolean = false;

// In production, look for frontend files in the correct location
if (process.env.NODE_ENV === 'production') {
  // Check multiple possible locations for the frontend files
  const possiblePaths = [
    { path: path.join(__dirname, '../public'), desc: 'backend/public' },          // Backend public directory
    { path: path.join(__dirname, '../../frontend/out'), desc: 'frontend/out' }, // Next.js export directory
    { path: path.join(__dirname, '../../frontend/.next/standalone'), desc: 'frontend/.next/standalone' }, // Standalone build
    { path: path.join(__dirname, '../frontend'), desc: 'backend/frontend' }         // Fallback
  ];
  
  logger.info('Checking for frontend files in the following locations:');
  for (const { path: possiblePath, desc } of possiblePaths) {
    const exists = fs.existsSync(possiblePath);
    logger.info(`- ${desc}: ${exists ? 'FOUND' : 'not found'} (${possiblePath})`);
    
    if (exists) {
      frontendPath = possiblePath;
      frontendExists = true;
      
      // Log contents of the directory for debugging
      try {
        const files = fs.readdirSync(possiblePath);
        logger.info(`  Contents (${files.length} items):`, files.slice(0, 10).join(', ') + (files.length > 10 ? ', ...' : ''));
      } catch (err) {
        logger.error(`  Error reading directory: ${err}`);
      }
      
      break;
    }
  }
} else {
  // In development, use the standard path
  frontendPath = path.join(process.cwd(), '..', 'frontend');
  frontendExists = fs.existsSync(frontendPath);

  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Frontend exists: ${frontendExists}`);
  logger.info(`Frontend path: ${frontendPath}`);
}

logger.info(`Looking for frontend files at: ${frontendPath}`);
logger.info(`Frontend directory exists: ${frontendExists}`);

// Serve static files if they exist
if (frontendExists) {
  logger.info('Serving static files from:', frontendPath);
  
  // Serve static files from the frontend directory
  app.use(express.static(frontendPath));
  
  // Also serve _next directory for Next.js static files
  const nextStaticPath = path.join(frontendPath, '_next');
  if (fs.existsSync(nextStaticPath)) {
    app.use('/_next', express.static(nextStaticPath));
  }
  
  // Handle SPA routing - serve index.html for all other routes
  app.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // For all other routes, serve the frontend's index.html
    const indexPath = path.join(frontendPath, 'index.html');
    logger.info(`Serving index.html from: ${indexPath}`);
    res.sendFile(indexPath, (err: Error | null) => {
      if (err) {
        logger.error('Error sending file:', err);
        return res.status(500).json({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to load frontend',
          timestamp: new Date().toISOString()
        });
      }
    });
  });
} else if (process.env.NODE_ENV === 'production') {
  logger.warn('Frontend files not found in production. Only API routes will be available.');
  
  // In production, serve a simple message if frontend files are missing
  app.get('*', (req: express.Request, res: express.Response) => {
    if (!req.path.startsWith('/api/')) {
      return res.status(404).json({
        status: 'backend-only',
        message: 'Backend is running but no frontend files were found.',
        timestamp: new Date().toISOString()
      });
    }
    res.status(404).json({ error: 'Not Found' });
  });
} else {
  // In development, provide a helpful message
  app.get('*', (req: express.Request, res: express.Response) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Development Mode - Frontend Not Served</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .info { background: #f0f7ff; padding: 15px; border-radius: 4px; margin: 20px 0; }
            code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <h1>Development Mode Active</h1>
          <div class="info">
            <p>This is the backend server running in development mode. The frontend is served from a separate development server.</p>
            <p>To access the frontend, please ensure the frontend development server is running and visit: <a href="http://localhost:3000">http://localhost:3000</a></p>
          </div>
          <h2>Backend API</h2>
          <p>The backend API is available at <code>http://localhost:3002/api/</code></p>
          <p>Current time: ${new Date().toISOString()}</p>
        </body>
      </html>
    `);
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
    }, {} as Record<string, any>);
  
  logger.debug('Environment variables:', envVars);
});

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
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
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
