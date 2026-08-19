import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;


const poolConfig = config.db.connectionString
  ? {
      connectionString: config.db.connectionString,
      ...(config.db.ssl ? { ssl: config.db.ssl } : {})
    }
  : {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      ...(config.db.ssl ? { ssl: config.db.ssl } : {})
    };

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.warn('PostgreSQL idle client notice:', err.message);
});

export const query = (text, params) => pool.query(text, params);
