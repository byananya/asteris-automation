import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { logger } from '../utils/logger.js';

function getDbConfig() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'asteris',
    password: process.env.DB_PASSWORD || 'asteris123',
    database: process.env.DB_NAME || 'asteris_db',
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false,
  };

  logger.info('Database configuration:', {
    ...config,
    password: config.password ? '***' : 'not set'
  });

  return config;
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...getDbConfig(),
  synchronize: false, // Disable auto-sync since we're managing schema manually
  logging: process.env.NODE_ENV !== 'production', // Enable logging in non-production
  entities: [], // No entities since we're using raw SQL
  migrations: [], // No migrations since we're managing schema manually
  subscribers: [],
  poolSize: 10,
  connectTimeoutMS: 30000,
});

// Initialize the database connection
let isInitialized = false;

export async function initializeDatabase() {
  if (isInitialized) {
    return AppDataSource;
  }

  try {
    logger.info('Initializing database connection...');
    await AppDataSource.initialize();
    isInitialized = true;
    logger.info('Database connection established successfully');
    return AppDataSource;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

// For CLI usage
export default AppDataSource;
