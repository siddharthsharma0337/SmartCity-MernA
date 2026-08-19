import { randomUUID } from 'node:crypto';
import { query } from '../config/db.js';
import { getMockRouteOrder } from '../services/routeService.js';
import { createNotification } from './notificationController.js';

// Admin/maintenance assigns a truck to collect a zone's highest-priority
// bins. Uses the STUB route order (routeService.js) until DevOps's real
// Route Optimizer exists — swap point is isolated to that one import.
export const createDispatch = async (req, res) => {
  const { truck_id, zone_id, stop_limit } = req.body;
  try {
    const truckResult = await query('SELECT * FROM trucks WHERE id = $1', [truck_id]);
    const truck = truckResult.rows[0];
    if (!truck) return res.status(404).json({ error: 'Truck not found' });
    if (truck.status !== 'available') {
      return res.status(400).json({ error: `Truck is ${truck.status}, not available for dispatch` });
    }

    const binIds = await getMockRouteOrder(zone_id, stop_limit || 10);
    if (!binIds.length) return res.status(400).json({ error: 'No bins found for this zone' });

    const routeId = randomUUID(); // routes.id is VARCHAR — must supply it
    const routeCode = `RT-${Date.now()}`;

    await query(
      `INSERT INTO routes (id, route_code, truck_id, zone_id, status, total_stops, start_time)
       VALUES ($1, $2, $3, $4, 'active', $5, NOW())`,
      [routeId, routeCode, truck_id, zone_id, binIds.length]
    );

    for (let i = 0; i < binIds.length; i++) {
      await query(
        `INSERT INTO route_stops (route_id, bin_id, stop_order, status)
         VALUES ($1, $2, $3, 'pending')`,
        [routeId, binIds[i], i + 1]
      );
    }

    await query(`UPDATE trucks SET status = 'on_route' WHERE id = $1`, [truck_id]);

    if (truck.driver_id) {
      await createNotification({
        userId: truck.driver_id,
        channel: 'push',
        title: 'New route assigned',
        body: `Route ${routeCode} — ${binIds.length} stops. Check your app for details.`,
      });
    }

    res.status(201).json({ route_id: routeId, route_code: routeCode, total_stops: binIds.length, bin_order: binIds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listRoutes = async (req, res) => {
  const { status, truck_id } = req.query;
  const clauses = [];
  const values = [];
  if (status) { values.push(status); clauses.push(`status = $${values.length}`); }
  if (truck_id) { values.push(truck_id); clauses.push(`truck_id = $${values.length}`); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  try {
    const result = await query(`SELECT * FROM routes ${where} ORDER BY created_at DESC`, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRouteDetail = async (req, res) => {
  try {
    const routeResult = await query('SELECT * FROM routes WHERE id = $1', [req.params.id]);
    if (!routeResult.rows.length) return res.status(404).json({ error: 'Route not found' });

    const stopsResult = await query(
      `SELECT rs.*, b.bin_code, b.name AS bin_name, b.location_lat, b.location_lng
       FROM route_stops rs JOIN bins b ON b.id = rs.bin_id
       WHERE rs.route_id = $1 ORDER BY rs.stop_order`,
      [req.params.id]
    );

    res.json({ ...routeResult.rows[0], stops: stopsResult.rows });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};