import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Event } from './src/events/entities/eventEntity';

config();

const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DATABASE_PATH || './data/events.db',
  entities: [Event],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

export default AppDataSource;
