import { randomUUID } from 'node:crypto';
import { query } from '../config/db.js';

export const createTruck = async (req, res) => {
  const { truck_code, driver_id, capacity_bins, capacity_kg } = req.body;
  const id = randomUUID(); // trucks.id is VARCHAR — must supply it
  try {
    const result = await query(
      `INSERT INTO trucks (id, truck_code, driver_id, capacity_bins, capacity_kg)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, truck_code, driver_id || null, capacity_bins || null, capacity_kg || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const listTrucks = async (req, res) => {
  try {
    const result = await query('SELECT * FROM trucks ORDER BY truck_code');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTruck = async (req, res) => {
  try {
    const result = await query('SELECT * FROM trucks WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Truck not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateTruck = async (req, res) => {
  const allowed = ['truck_code', 'driver_id', 'capacity_bins', 'capacity_kg', 'status', 'current_lat', 'current_lng'];
  const sets = [];
  const values = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      values.push(req.body[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'No valid fields to update' });
  values.push(req.params.id);
  try {
    const result = await query(`UPDATE trucks SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Truck not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTruck = async (req, res) => {
  try {
    const result = await query('DELETE FROM trucks WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Truck not found' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};