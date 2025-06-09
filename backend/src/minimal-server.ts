import express from 'express';
import { logger } from './utils/logger.js';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { AppDataSource } from './config/data-source.js';
import * as http from 'http';

// Load environment variables
config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

// Initialize database connection
let dbConnection: DataSource | null = null;

async function initializeDatabase(): Promise<DataSource> {
  try {
    console.log('Initializing database connection...');
    
    // Log environment variables for debugging (without sensitive data)
    console.log('Database connection details:', {
      host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
      port: process.env.PGPORT || process.env.DB_PORT || '5432',
      database: process.env.PGDATABASE || process.env.DB_NAME || 'postgres',
      username: process.env.PGUSER || process.env.DB_USER || 'postgres',
      ssl: process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'
    });
    
    dbConnection = await AppDataSource.initialize();
    console.log('✅ Database connection established successfully');
    return dbConnection;
  } catch (error: any) {
    console.error('❌ Failed to initialize database:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔴 Connection refused. Please check:');
      console.error('1. Is the database server running?');
      console.error('2. Are the database credentials correct?');
      console.error('3. Is the database host accessible from this network?');
      console.error('4. Is the database port open and not blocked by a firewall?');
    } else if (error.code === '3D000') { // Database does not exist
      console.error('\n🔴 Database does not exist. Please create the database first.');
    } else if (error.code === '28P01') { // Invalid password
      console.error('\n🔴 Authentication failed. Please check your database credentials.');
    }
    
    console.error('\nEnvironment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      PGHOST: process.env.PGHOST ? '***' : 'not set',
      PGPORT: process.env.PGPORT || 'not set',
      PGDATABASE: process.env.PGDATABASE || 'not set',
      PGUSER: process.env.PGUSER || 'not set',
      PGPASSWORD: process.env.PGPASSWORD ? '***' : 'not set',
    });
    
    throw error;
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/healthz', async (req, res) => {
  try {
    const healthCheck: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      db: { status: 'unknown' }
    };

    // Check database connection if available
    if (dbConnection?.isInitialized) {
      try {
        await dbConnection.query('SELECT 1');
        healthCheck.db.status = 'connected';
      } catch (error) {
        const dbError = error as Error;
        healthCheck.status = 'error';
        healthCheck.db.status = 'error';
        healthCheck.db.error = dbError.message;
      }
    } else {
      healthCheck.db.status = 'not_initialized';
    }

    // If any critical check fails, return 503
    const statusCode = healthCheck.status === 'ok' ? 200 : 503;
    
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('X-Response-Time', '0ms');
    
    if (statusCode === 200) {
      logger.info('Health check successful', healthCheck);
      res.status(200).json(healthCheck);
    } else {
      logger.error('Health check failed', healthCheck);
      res.status(503).json({
        status: 'error',
        message: 'Service Unavailable',
        details: healthCheck,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Health check handler error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Asteris Automation API',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start the server
async function startServer(): Promise<http.Server> {
  console.log('🚀 Starting server...');
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Connecting to database at ${process.env.PGHOST || process.env.DB_HOST || 'localhost'}:${process.env.PGPORT || process.env.DB_PORT || '5432'}`);
  
  try {
    // Initialize database connection first
    try {
      await initializeDatabase();
    } catch (error) {
      console.error('❌ Fatal error: Could not connect to the database. Server cannot start.');
      process.exit(1);
    }

    // Create HTTP server
    const server = http.createServer(app);
    
    // Start listening
    return new Promise<http.Server>((resolve, reject) => {
      server.listen(port, '0.0.0.0', () => {
        const address = server.address();
        const serverUrl = typeof address === 'string' 
          ? address 
          : `http://${address?.address === '::' ? 'localhost' : address?.address}:${address?.port}`;
        
        logger.info(`✅ Server is running on ${serverUrl}`);
        console.log('\n🚀 Server started successfully!');
        console.log(`🌍 Server URL: ${serverUrl}`);
        console.log(`📊 Health check: ${serverUrl}/healthz\n`);
        
        resolve(server);
      });
      
      server.on('error', (error: NodeJS.ErrnoException) => {
        logger.error('Server error:', error);
        console.error('\n❌ Server error:', error.message);
        
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use. Please free the port or use a different one.`);
        } else if (error.code === 'EACCES') {
          console.error(`Permission denied: Port ${port} requires elevated privileges.`);
        }
        
        reject(error);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('\n❌ Fatal error during startup:', error);
    process.exit(1);
  }
}

// Start the application
let server: http.Server | null = null;

startServer()
  .then((srv: http.Server) => {
    server = srv;
  })
  .catch((error: Error) => {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  });

// Handle graceful shutdown
function shutdown() {
  logger.info('Shutting down server...');
  
  // Close the HTTP server if it exists
  if (server) {
    server.close(() => {
      logger.info('HTTP server has been stopped');
      
      // Close database connection if it exists
      if (dbConnection?.isInitialized) {
        dbConnection.destroy()
          .then(() => {
            logger.info('Database connection has been closed');
            process.exit(0);
          })
          .catch((error) => {
            logger.error('Error closing database connection:', error);
            process.exit(1);
          });
      } else {
        process.exit(0);
      }
    });

    // Force shutdown after 5 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 5000);
  } else {
    process.exit(0);
  }
};

// Handle process termination
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Consider restarting the process in production
  if (process.env.NODE_ENV === 'production') {
    shutdown();
  }
});

export default server;
