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

  redisSubscriber = createClient({ url: config.redis.url });
  redisSubscriber.on('error', (err) => console.log('Redis Subscriber Error', err));
  await redisSubscriber.connect();

  console.log('WebSocket server initialized');

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

  // Listen to Redis Pub/Sub for live updates from workers/other services
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
};
