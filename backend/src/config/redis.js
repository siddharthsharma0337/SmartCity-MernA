import { createClient } from 'redis';
import { config } from './env.js';

export const redisClient = createClient({
  url: config.redis.url,
  socket: {
    reconnectStrategy: (retries) => (retries > 1 ? false : 1000)
  }
});

redisClient.on('error', (err) => {
  // Suppress continuous reconnection spam if Redis is offline
  if (process.env.DEBUG_REDIS) {
    console.warn('Redis Client Warning:', err.message);
  }
});

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('Connected to Redis');
    }
  } catch (error) {
    console.warn('Redis connection failed:', error.message);
    console.warn('Backend server running without active Redis connection. (Telemetry ingestion/worker features will require Redis)');
  }
};
