import { randomUUID } from 'node:crypto';
import { query } from '../config/db.js';

export const createBin = async (req, res) => {
  const { bin_code, name, zone_id, location_lat, location_lng, capacity_liters } = req.body;
  const id = randomUUID(); // his bins.id is VARCHAR, not auto-increment — must supply it
  try {
    const result = await query(
      `INSERT INTO bins (id, bin_code, name, zone_id, location_lat, location_lng, capacity_liters)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, bin_code, name || null, zone_id, location_lat, location_lng, capacity_liters]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const listBins = async (req, res) => {
  const { zone, status, minPriority } = req.query;
  const clauses = [];
  const values = [];

  if (zone) { values.push(zone); clauses.push(`zone_id = $${values.length}`); }
  if (status) { values.push(status); clauses.push(`status = $${values.length}`); }
  if (minPriority) { values.push(minPriority); clauses.push(`priority_score >= $${values.length}`); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  try {
    const result = await query(`SELECT * FROM bins ${where} ORDER BY priority_score DESC NULLS LAST`, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBin = async (req, res) => {
  try {
    const result = await query('SELECT * FROM bins WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Bin not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateBin = async (req, res) => {
  // Whitelisted fields MERN-B owns. current_fill_pct, battery_pct,
  // temperature_c, last_seen_at stay owned by MERN-A's ingestion —
  // don't let this route touch them.
  const allowed = ['bin_code', 'name', 'zone_id', 'location_lat', 'location_lng', 'capacity_liters', 'status'];
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
    const result = await query(`UPDATE bins SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Bin not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteBin = async (req, res) => {
  try {
    const result = await query('DELETE FROM bins WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Bin not found' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};