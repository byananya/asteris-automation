import { DataSource } from 'typeorm';
import { Invoice } from '../entities/Invoice.js';
import { Payout } from '../entities/Payout.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'asteris',
  password: process.env.DB_PASSWORD || 'asteris123',
  database: process.env.DB_NAME || 'asteris_db',
  synchronize: true, // In development only, use migrations in production
  logging: true,
  entities: [Invoice, Payout],
  subscribers: [],
  migrations: [],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};
