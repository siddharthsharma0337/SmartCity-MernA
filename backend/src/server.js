import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import { config } from './config/env.js';
import { connectRedis } from './config/redis.js';
import { pool } from './config/db.js';
import { initWebSocket } from './websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const autoMigrate = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to PostgreSQL DB. Verifying schema...');
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('Database tables & schema verified successfully.');
    }
  } catch (error) {
    console.warn('Database initialization note:', error.message);
    console.warn('If deploying on Render, make sure DATABASE_URL is set in Render Environment Variables.');
  } finally {
    if (client) client.release();
  }
};

const startServer = async () => {
  try {
    const server = http.createServer(app);

    // Initialize WebSockets safely
    await initWebSocket(server);

    // Start listening on port immediately so Render health check passes right away
    server.listen(config.port, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${config.port}`);
    });

    // Run database verification / migration in background
    autoMigrate();

    // Connect Redis in background
    connectRedis().catch(() => {});
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

