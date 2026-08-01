import { query } from '../config/db.js';
import { getPrediction } from '../services/predictClient.js';
import { calculatePriorityScore } from '../services/priorityService.js';

// His schema has no dedicated "last collected" column on bins — the closest
// signal is the most recent VISITED route_stop for that bin.
async function getLastCollectedAt(binId) {
  const result = await query(
    `SELECT actual_arrival_time FROM route_stops
     WHERE bin_id = $1 AND status = 'visited'
     ORDER BY actual_arrival_time DESC LIMIT 1`,
    [binId]
  );
  return result.rows[0]?.actual_arrival_time || null;
}

export const recalculateBinPriority = async (req, res) => {
  const binId = req.params.id; // string, not integer — his bins.id is VARCHAR
  try {
    const binResult = await query('SELECT * FROM bins WHERE id = $1', [binId]);
    const bin = binResult.rows[0];
    if (!bin) return res.status(404).json({ error: 'Bin not found' });

    const [prediction, lastCollectedAt] = await Promise.all([
      getPrediction(binId), // STUB — swaps to real AI/ML call later
      getLastCollectedAt(binId),
    ]);

    const score = calculatePriorityScore({
      currentFillPercent: bin.current_fill_pct,
      prediction,
      lastCollectedAt,
    });

    const updated = await query(
      `UPDATE bins
       SET priority_score = $1,
           predicted_time_to_full_hours = $2,
           predicted_confidence = $3,
           predicted_at = NOW()
       WHERE id = $4 RETURNING *`,
      [score, prediction.predicted_time_to_full_hours, prediction.confidence, binId]
    );

    res.json({ bin: updated.rows[0], prediction, lastCollectedAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const recalculateAllPriorities = async (req, res) => {
  try {
    const binsResult = await query('SELECT id, current_fill_pct FROM bins');
    const results = [];

    for (const bin of binsResult.rows) {
      const [prediction, lastCollectedAt] = await Promise.all([
        getPrediction(bin.id),
        getLastCollectedAt(bin.id),
      ]);

      const score = calculatePriorityScore({
        currentFillPercent: bin.current_fill_pct,
        prediction,
        lastCollectedAt,
      });

      await query(
        `UPDATE bins
         SET priority_score = $1, predicted_time_to_full_hours = $2,
             predicted_confidence = $3, predicted_at = NOW()
         WHERE id = $4`,
        [score, prediction.predicted_time_to_full_hours, prediction.confidence, bin.id]
      );

      results.push({ bin_id: bin.id, score, confidence: prediction.confidence });
    }

    res.json({ updated: results.length, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};