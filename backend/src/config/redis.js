import { createClient } from 'redis';
import { config } from './env.js';

export const redisClient = createClient({
  url: config.redis.url
});

redisClient.on('error', (err) => {
  // Avoid unhandled rejection crashing the process if Redis is unavailable
  console.warn('Redis Client Warning:', err.message);
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
