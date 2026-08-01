/**
 * predictClient.js — STUB.
 *
 * Real version will call AI/ML's live /predict endpoint (Phase 4 handoff).
 * Until that URL exists, this returns a mock shaped EXACTLY like the
 * contract confirmed by the AI/ML dev:
 *
 *   { bin_id, predicted_time_to_full_hours, extrapolation_estimate_hours,
 *     confidence, mode }
 *
 * Swap instructions once the real endpoint is live:
 *   1. Replace the body of getPrediction() with an actual HTTP call
 *      (fetch/axios) to the /predict URL AI/ML gives you.
 *   2. Keep the function signature identical — priorityService.js
 *      doesn't need to change at all if you do this right.
 *   3. Delete the MOCK_RESPONSES object below.
 */

const MOCK_RESPONSES = {
  default: {
    predicted_time_to_full_hours: 25.3,
    extrapolation_estimate_hours: 3.0,
    confidence: 'low',
    mode: 'model',
  },
};

export const getPrediction = async (binId) => {
  // Simulates network latency so downstream async handling gets tested properly
  await new Promise((resolve) => setTimeout(resolve, 50));

  const mock = MOCK_RESPONSES[binId] || MOCK_RESPONSES.default;
  return {
    bin_id: binId,
    ...mock,
  };
};
