import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import ingestionRoutes from './routes/ingestionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

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

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

export default app;
