import { query } from '../config/db.js';
import { createNotification } from './notificationController.js';

// GET /api/v1/driver/route — driver's own currently active route.
// This is the Phase 7 handoff point to Android (they'll consume this
// exact response shape).
export const getMyRoute = async (req, res) => {
  try {
    const truckResult = await query('SELECT * FROM trucks WHERE driver_id = $1', [req.user.id]);
    const truck = truckResult.rows[0];
    if (!truck) return res.status(404).json({ error: 'No truck assigned to this driver' });

    const routeResult = await query(
      `SELECT * FROM routes WHERE truck_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [truck.id]
    );
    const route = routeResult.rows[0];
    if (!route) return res.status(404).json({ error: 'No active route' });

    const stopsResult = await query(
      `SELECT rs.*, b.bin_code, b.name AS bin_name, b.location_lat, b.location_lng, b.current_fill_pct
       FROM route_stops rs JOIN bins b ON b.id = rs.bin_id
       WHERE rs.route_id = $1 ORDER BY rs.stop_order`,
      [route.id]
    );

    res.json({ ...route, stops: stopsResult.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/v1/driver/task-complete — body: { stop_id }
export const completeTask = async (req, res) => {
  const { stop_id } = req.body;
  try {
    const stopResult = await query(
      `UPDATE route_stops SET status = 'visited', actual_arrival_time = NOW()
       WHERE id = $1 RETURNING *`,
      [stop_id]
    );
    const stop = stopResult.rows[0];
    if (!stop) return res.status(404).json({ error: 'Stop not found' });

    // If every stop on this route is now visited/skipped, close the route
    // out and free the truck up for the next dispatch.
    const remaining = await query(
      `SELECT COUNT(*) FROM route_stops WHERE route_id = $1 AND status = 'pending'`,
      [stop.route_id]
    );

    if (Number(remaining.rows[0].count) === 0) {
      const routeResult = await query(
        `UPDATE routes SET status = 'completed', end_time = NOW() WHERE id = $1 RETURNING *`,
        [stop.route_id]
      );
      const route = routeResult.rows[0];
      await query(`UPDATE trucks SET status = 'available' WHERE id = $1`, [route.truck_id]);
    }

    // Reset the collected bin's fill/priority — real values come back
    // from MERN-A's ingestion on the next sensor reading, this is just
    // an immediate UI-friendly reset so the dashboard doesn't show a
    // stale 95%-full bin as still needing collection.
    await query(
      `UPDATE bins SET current_fill_pct = 0, priority_score = 0 WHERE id = $1`,
      [stop.bin_id]
    );

    res.json({ stop, message: 'Task marked complete' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};