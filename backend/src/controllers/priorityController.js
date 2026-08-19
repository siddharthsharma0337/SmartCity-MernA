import { query } from '../config/db.js';
import { getPriorityPrediction } from '../services/predictClient.js';
import { calculatePriorityScore } from '../services/priorityService.js';

// Render free tier sleeps when idle — first call after inactivity can be
// slow or occasionally fail. If the real API errors out, fall back to the
// local formula (priorityService.js) instead of crashing the request —
// better a slightly-rough score during a demo than a 500 error.
async function buildPredictionPayload(bin) {
  const readingsResult = await query(
    `SELECT fill_pct, created_at FROM bin_readings WHERE bin_id = $1 ORDER BY created_at DESC LIMIT 2`,
    [bin.id]
  );
  const [latest, prev] = readingsResult.rows;

  const lastCollectedResult = await query(
    `SELECT actual_arrival_time FROM route_stops
     WHERE bin_id = $1 AND status = 'visited' ORDER BY actual_arrival_time DESC LIMIT 1`,
    [bin.id]
  );
  const lastCollectedAt = lastCollectedResult.rows[0]?.actual_arrival_time || null;
  const lastCollectionMinutesAgo = lastCollectedAt
    ? Math.round((Date.now() - new Date(lastCollectedAt).getTime()) / (1000 * 60))
    : null;

  return {
    bin_id: bin.id,
    fill_level: bin.current_fill_pct,
    battery: bin.battery_pct,
    temperature: bin.temperature_c,
    location: { lat: Number(bin.location_lat), lng: Number(bin.location_lng) },
    timestamp: new Date().toISOString(),
    zone_id: bin.zone_id ? String(bin.zone_id) : null,
    prev_fill_level: prev?.fill_pct ?? null,
    prev_timestamp: prev?.created_at ?? null,
    last_collection_minutes_ago: lastCollectionMinutesAgo,
  };
}

export const recalculateBinPriority = async (req, res) => {
  const binId = req.params.id;
  try {
    const binResult = await query('SELECT * FROM bins WHERE id = $1', [binId]);
    const bin = binResult.rows[0];
    if (!bin) return res.status(404).json({ error: 'Bin not found' });

    const payload = await buildPredictionPayload(bin);

    let score, predictedHours, source;
    try {
      const prediction = await getPriorityPrediction(payload);
      score = prediction.score;
      predictedHours = prediction.reason?.predicted_time_to_full_hours ?? null;
      source = 'ai_service';
    } catch (apiError) {
      console.warn('Prediction API failed, using local fallback formula:', apiError.message);
      score = calculatePriorityScore({
        currentFillPercent: bin.current_fill_pct,
        prediction: { confidence: 'low', extrapolation_estimate_hours: 3, predicted_time_to_full_hours: null },
        lastCollectedAt: null,
      });
      predictedHours = null;
      source = 'local_fallback';
    }

    const updated = await query(
      `UPDATE bins SET priority_score = $1, predicted_time_to_full_hours = $2, predicted_at = NOW()
       WHERE id = $3 RETURNING *`,
      [score, predictedHours, binId]
    );

    res.json({ bin: updated.rows[0], source, payload_sent: payload });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const recalculateAllPriorities = async (req, res) => {
  try {
    const binsResult = await query('SELECT * FROM bins');
    const results = [];

    for (const bin of binsResult.rows) {
      try {
        const payload = await buildPredictionPayload(bin);
        let score, predictedHours;
        try {
          const prediction = await getPriorityPrediction(payload);
          score = prediction.score;
          predictedHours = prediction.reason?.predicted_time_to_full_hours ?? null;
        } catch {
          score = calculatePriorityScore({
            currentFillPercent: bin.current_fill_pct,
            prediction: { confidence: 'low', extrapolation_estimate_hours: 3, predicted_time_to_full_hours: null },
            lastCollectedAt: null,
          });
          predictedHours = null;
        }
        await query(
          `UPDATE bins SET priority_score = $1, predicted_time_to_full_hours = $2, predicted_at = NOW() WHERE id = $3`,
          [score, predictedHours, bin.id]
        );
        results.push({ bin_id: bin.id, score });
      } catch (binError) {
        results.push({ bin_id: bin.id, error: binError.message });
      }
    }

    res.json({ updated: results.length, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};