import { Server } from 'socket.io';
import { createClient } from 'redis';
import { config } from './config/env.js';

let io;
let redisSubscriber;

export const initWebSocket = async (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Clients can subscribe to specific channels (e.g., 'bins', 'trucks', 'alerts')
    socket.on('subscribe', (channel) => {
      socket.join(channel);
      console.log(`Client ${socket.id} joined channel ${channel}`);
    });

    socket.on('unsubscribe', (channel) => {
      socket.leave(channel);
      console.log(`Client ${socket.id} left channel ${channel}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Attempt Redis Pub/Sub subscription for live updates
  try {
    redisSubscriber = createClient({
      url: config.redis.url,
      socket: {
        reconnectStrategy: (retries) => (retries > 1 ? false : 1000)
      }
    });
    redisSubscriber.on('error', (err) => {
      if (process.env.DEBUG_REDIS) {
        console.warn('Redis Subscriber Warning:', err.message);
      }
    });
    await redisSubscriber.connect();

    await redisSubscriber.subscribe('live_updates', (message) => {
      try {
        const data = JSON.parse(message);
        // Expected payload: { type: 'bin_update' | 'alert' | 'truck_update', data: { ... } }
        if (data.type) {
          // Emit to a specific room based on the event type
          io.to(data.type).emit(data.type, data.data);
        }
      } catch (err) {
        console.error('Error parsing live update message:', err);
      }
    });
    console.log('Redis subscriber connected for WebSocket updates');
  } catch (err) {
    console.warn('Redis subscriber skipped or failed to connect:', err.message);
  }

  console.log('WebSocket server initialized');
};
