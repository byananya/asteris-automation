import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import intentRouter from './api/routes/intentRouter';
import stripeReconciliationRoutes from './routes/stripeReconciliationRoutes';
import emailSignupRouter from './routes/emailSignup';
import { createLogger, format, transports } from 'winston';

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'API_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Check if we're in development mode and log a warning for missing Stripe key
if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== 'production') {
  console.warn('Warning: STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.');
}

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
const port = process.env.PORT || 3000;

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Configure CORS - Simplified configuration to fix preflight issues
const allowedOrigins = [
  'http://localhost:3000',
  'https://app.asterisai.org',
  'https://asteris-ai.vercel.app',
  'https://asteris-automation.vercel.app',
  'https://asteris-frontend-production.up.railway.app'
];

// Add any additional origins from environment variables
if (process.env.CORS_ORIGIN) {
  const envOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  envOrigins.forEach(origin => {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}

// Log all allowed origins for debugging
console.log('CORS Allowed Origins:', allowedOrigins);

const corsOptions = {
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      console.log(`CORS: Allowing request from origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`CORS: Blocking request from non-allowed origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-stripe-key', 'X-Requested-With', 'Origin', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
};

// Log CORS configuration for debugging
console.log('CORS Configuration:', {
  allowedOrigins,
  nodeEnv: process.env.NODE_ENV,
  corsOrigin: process.env.CORS_ORIGIN
});

// Apply CORS with the configured options
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests explicitly
app.options('*', (req, res) => {
  console.log('Handling OPTIONS preflight request for path:', req.path);
  // Set CORS headers manually for preflight
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-stripe-key, X-Requested-With, Origin, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Respond with 204 No Content
  res.status(204).end();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

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

// Use built-in __dirname and __filename in CommonJS
const rootDir = path.resolve(__dirname, '..');

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

// Debug endpoint to list all routes (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/routes', (req, res) => {
    const routes: { method: string; path: string }[] = [];
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        // routes registered directly on the app
        routes.push({ method: Object.keys(middleware.route.methods)[0].toUpperCase(), path: middleware.route.path });
      } else if (middleware.name === 'router' && middleware.handle.stack) {
        // router middleware
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            routes.push({ method: Object.keys(handler.route.methods)[0].toUpperCase(), path: handler.route.path });
          }
        });
      }
    });
    res.json({ routes });
  });
}


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
  frontendPath = path.join(__dirname, '../frontend');
  frontendExists = fs.existsSync(frontendPath);
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
const host = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
const portNumber = typeof port === 'string' ? parseInt(port, 10) : port;

const server = app.listen(portNumber, host, () => {
  logger.info(`Server is running on http://${host}:${portNumber}`);
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
      logger.error(`${bind} (${portNumber}) requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} (${portNumber}) is already in use`);
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
