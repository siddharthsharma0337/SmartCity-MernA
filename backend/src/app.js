import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import ingestionRoutes from './routes/ingestionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import binRoutes from './routes/binRoutes.js';
import truckRoutes from './routes/truckRoutes.js';
import zoneRoutes from './routes/zoneRoutes.js';
import priorityRoutes from './routes/priorityRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import dispatchRoutes from './routes/dispatchRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'smart-waste-backend' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/v1', ingestionRoutes);
app.use('/api/v1/admin', analyticsRoutes);
app.use('/api/v1/bins', binRoutes);
app.use('/api/v1/trucks', truckRoutes);
app.use('/api/v1/zones', zoneRoutes);
app.use('/api/v1/priority', priorityRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/dispatch', dispatchRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/users', userRoutes);
// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

export default app;
