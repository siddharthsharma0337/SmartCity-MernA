/**
 * priorityService.js — the actual scoring formula.
 *
 * score = f(current fill %, effective time-to-full, hours since last collected)
 *
 * "effective time-to-full" is NOT always predicted_time_to_full_hours —
 * see getEffectiveTimeToFull(). This is the confidence-aware rule the
 * AI/ML dev flagged as critical: when confidence is "low", the model's
 * own number isn't trustworthy, so we fall back to the simple linear
 * extrapolation instead.
 */

export const getEffectiveTimeToFull = (prediction) => {
  if (prediction.confidence === 'low') {
    return prediction.extrapolation_estimate_hours;
  }
  return prediction.predicted_time_to_full_hours;
};

export const calculatePriorityScore = ({ currentFillPercent, prediction, lastCollectedAt }) => {
  const effectiveHours = getEffectiveTimeToFull(prediction);

  // Fill urgency: 0-100, directly from current fill
  const fillUrgency = currentFillPercent;

  // Time urgency: sooner-to-full = higher score. Cap at 72h so bins far
  // from full don't produce near-zero noise; clamp negative (already
  // overflowing) to max urgency.
  const cappedHours = Math.max(0, Math.min(effectiveHours, 72));
  const timeUrgency = 100 * (1 - cappedHours / 72);

  // Staleness: bins not collected in a while creep up in priority even
  // if fill % is moderate (avoids a bin getting stuck forever at "medium")
  const hoursSinceCollected = lastCollectedAt
    ? (Date.now() - new Date(lastCollectedAt).getTime()) / (1000 * 60 * 60)
    : 48; // unknown collection history = treat as moderately stale
  const stalenessUrgency = Math.min(100, hoursSinceCollected); // caps at 100h

  // Weighted blend — tune these weights during Step 5 testing (doc §4:
  // "known fill-levels produce expected priority ordering")
  const WEIGHTS = { fill: 0.5, time: 0.35, staleness: 0.15 };

  const score =
    WEIGHTS.fill * fillUrgency +
    WEIGHTS.time * timeUrgency +
    WEIGHTS.staleness * stalenessUrgency;

  return Math.round(Math.min(100, Math.max(0, score)) * 100) / 100;
};
