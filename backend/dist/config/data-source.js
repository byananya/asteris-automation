import 'reflect-metadata';
import { DataSource } from 'typeorm';
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'asteris',
    password: process.env.DB_PASSWORD || 'asteris123',
    database: process.env.DB_NAME || 'asteris_db',
    synchronize: false, // Disable auto-sync since we're managing schema manually
    logging: true, // Enable logging for debugging
    entities: [], // No entities since we're using raw SQL
    migrations: [], // No migrations since we're managing schema manually
    subscribers: [],
});
// For CLI usage
export default AppDataSource;
