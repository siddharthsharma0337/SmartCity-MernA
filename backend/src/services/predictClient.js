/**
 * predictClient.js — now wired to the REAL AI/ML service.
 * Confirmed live via Swagger "Try it out" on 2026-08-10.
 */
const PREDICTION_API_BASE = 'https://smart-waste-prediction.onrender.com';

export const getPriorityPrediction = async (payload) => {
  const response = await fetch(`${PREDICTION_API_BASE}/predict/priority-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Prediction API error ${response.status}: ${errText}`);
  }

  return response.json();
  // Real shape confirmed:
  // { bin_id, zone_id, score, reason: { fill_level, predicted_time_to_full_hours, last_collection_minutes_ago } }
};