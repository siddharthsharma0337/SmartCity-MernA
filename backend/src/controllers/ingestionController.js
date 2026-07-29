import { redisClient } from '../config/redis.js';

const STREAM_NAME = 'bin_telemetry_stream';

export const ingestBinData = async (req, res) => {
  try {
    const payload = req.body;

    // Basic validation based on schema
    if (!payload.bin_id || typeof payload.fill_pct !== 'number' || typeof payload.battery_pct !== 'number') {
      return res.status(400).json({ error: 'Invalid payload: bin_id, fill_pct, battery_pct are required' });
    }

    // Acknowledge payload quickly and push to Redis Stream
    const message = {
      ...payload,
      source: payload.source || 'iot',
      timestamp: payload.timestamp || new Date().toISOString()
    };

    // Use string values for XADD payload per Redis requirements
    const stringifiedMessage = Object.entries(message).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return acc;
    }, {});

    await redisClient.xAdd(STREAM_NAME, '*', stringifiedMessage);

    res.status(202).json({ message: 'Payload accepted for processing' });
  } catch (error) {
    console.error('Ingestion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
