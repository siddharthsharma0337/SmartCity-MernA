import { redisClient, connectRedis } from '../config/redis.js';
import { query, pool } from '../config/db.js';
import { config } from '../config/env.js';
import { createClient } from 'redis';

let redisPublisher;


const STREAM_NAME = 'bin_telemetry_stream';
const CONSUMER_GROUP = 'backend_workers';
const CONSUMER_NAME = `worker-${process.pid}`;

async function initializeStream() {
  try {
    await redisClient.xGroupCreate(STREAM_NAME, CONSUMER_GROUP, '0', { MKSTREAM: true });
    console.log(`Created consumer group ${CONSUMER_GROUP} for stream ${STREAM_NAME}`);
  } catch (error) {
    if (!error.message.includes('BUSYGROUP')) {
      console.error('Error creating consumer group:', error);
    }
  }
}

async function processMessage(message) {
  const { id, message: data } = message;
  
  try {
    const bin_id = data.bin_id;
    const fill_pct = parseInt(data.fill_pct, 10);
    const battery_pct = parseInt(data.battery_pct, 10);
    const temperature_c = data.temperature_c ? parseFloat(data.temperature_c) : null;
    const source = data.source || 'iot';
    
    // Parse location if it was stringified
    let location_lat = null, location_lng = null;
    if (data.location) {
      try {
        const loc = JSON.parse(data.location);
        location_lat = loc.lat;
        location_lng = loc.lng;
      } catch (e) {
        // Fallback or ignore
      }
    } else {
      location_lat = data.location_lat ? parseFloat(data.location_lat) : null;
      location_lng = data.location_lng ? parseFloat(data.location_lng) : null;
    }

    // 1. Insert into History (bin_readings)
    await query(`
      INSERT INTO bin_readings (bin_id, fill_pct, battery_pct, temperature_c, location_lat, location_lng, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [bin_id, fill_pct, battery_pct, temperature_c, location_lat, location_lng, source]);

    // 2. Fault Logic / Alerts
    let bin_status = 'active';
    if (battery_pct < 20) {
      const alertRes = await query(`
        INSERT INTO alerts (bin_id, alert_type, severity, message) 
        VALUES ($1, 'low_battery', 'high', 'Battery is critically low')
        RETURNING *
      `, [bin_id]);
      bin_status = 'warning';
      redisPublisher.publish('live_updates', JSON.stringify({ type: 'alerts', data: alertRes.rows[0] }));
    }
    if (fill_pct >= 90) {
      const alertRes = await query(`
        INSERT INTO alerts (bin_id, alert_type, severity, message) 
        VALUES ($1, 'full', 'medium', 'Bin is full and needs collection')
        RETURNING *
      `, [bin_id]);
      bin_status = 'full';
      redisPublisher.publish('live_updates', JSON.stringify({ type: 'alerts', data: alertRes.rows[0] }));
    }

    // 3. Update Bins table
    const binRes = await query(`
      UPDATE bins 
      SET current_fill_pct = $1, battery_pct = $2, temperature_c = $3, status = $4, last_seen_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [fill_pct, battery_pct, temperature_c, bin_status, bin_id]);

    if (binRes.rows.length > 0) {
       redisPublisher.publish('live_updates', JSON.stringify({ type: 'bins', data: binRes.rows[0] }));
    }

    // Acknowledge message
    await redisClient.xAck(STREAM_NAME, CONSUMER_GROUP, id);
    console.log(`Processed message ${id} for bin ${bin_id}`);

  } catch (err) {
    console.error(`Error processing message ${id}:`, err);
  }
}

async function startWorker() {
  await connectRedis();
  
  // Create a separate publisher client
  redisPublisher = createClient({ url: config.redis.url });
  await redisPublisher.connect();
  
  // ensure we have DB connection
  const dbClient = await pool.connect();
  dbClient.release();

  await initializeStream();

  console.log(`Worker ${CONSUMER_NAME} started, listening to stream ${STREAM_NAME}...`);

  while (true) {
    try {
      const response = await redisClient.xReadGroup(
        redisClient.commandOptions({ isolated: true }),
        CONSUMER_GROUP,
        CONSUMER_NAME,
        [{ key: STREAM_NAME, id: '>' }],
        { BLOCK: 5000, COUNT: 10 }
      );

      if (response && response.length > 0) {
        const stream = response[0];
        const messages = stream.messages;

        for (const message of messages) {
          await processMessage(message);
        }
      }
    } catch (err) {
      console.error('Worker loop error:', err);
      // Wait a bit before retrying to prevent rapid error loops
      await new Promise(res => setTimeout(res, 1000));
    }
  }
}

startWorker();
