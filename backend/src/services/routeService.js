import { query } from '../config/db.js';

/**
 * getMockRouteOrder — STUB standing in for DevOps's Route Optimizer.
 * Real version (Phase 6, DevOps) will do Greedy-Nearest + priority.
 * This version just orders bins in a zone by priority_score DESC —
 * legitimate enough to test Dispatch end-to-end, but NOT the real
 * routing logic. Swap this function's body once DevOps hands off their
 * output format — keep the return shape (array of bin_id strings)
 * identical so dispatchController.js doesn't need to change.
 */
export const getMockRouteOrder = async (zoneId, limit = 10) => {
  const result = await query(
    `SELECT id FROM bins WHERE zone_id = $1 ORDER BY priority_score DESC NULLS LAST LIMIT $2`,
    [zoneId, limit]
  );
  return result.rows.map((r) => r.id);
};