import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER || 'traccar',
  password: process.env.DB_PASSWORD || 'traccar',
  database: process.env.DB_NAME || 'traccar_db',
  synchronize: false,
  logging: true,
  entities: [join(__dirname, '/entities/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/migrations/*{.ts,.js}')],
  subscribers: [],
});
