import http from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { connectRedis } from './config/redis.js';
import { pool } from './config/db.js';
import { initWebSocket } from './websocket.js';

const startServer = async () => {
  try {
    // Connect to Redis
    await connectRedis();

    // Verify DB connection
    const dbClient = await pool.connect();
    console.log('Connected to PostgreSQL DB');
    dbClient.release();

    const server = http.createServer(app);
    await initWebSocket(server);

    server.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
