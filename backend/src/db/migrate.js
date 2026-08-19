import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
  let client;
  try {
    console.log('Connecting to PostgreSQL to run migrations...');
    client = await pool.connect();
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schemaSql);
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.warn('Migration warning:', error.message);
  } finally {
    if (client) client.release();
    try {
      await pool.end();
    } catch {}
  }
};

runMigrations();
