import { createClient } from 'redis';
import { config } from './env.js';

export const redisClient = createClient({
  url: config.redis.url
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Connected to Redis');
  }
};
