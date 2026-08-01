import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;


export const pool = new Pool({ ...config.db, ssl: { rejectUnauthorized: false } });

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);
