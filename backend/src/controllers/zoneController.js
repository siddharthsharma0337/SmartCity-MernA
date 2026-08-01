import { query } from '../config/db.js';

export const createZone = async (req, res) => {
  const { name, city, polygon_geojson, priority_level } = req.body;
  try {
    const result = await query(
      `INSERT INTO zones (name, city, polygon_geojson, priority_level)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, city, polygon_geojson ? JSON.stringify(polygon_geojson) : null, priority_level || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const listZones = async (req, res) => {
  try {
    const result = await query('SELECT * FROM zones ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getZone = async (req, res) => {
  try {
    const result = await query('SELECT * FROM zones WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Zone not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateZone = async (req, res) => {
  const allowed = ['name', 'city', 'polygon_geojson', 'priority_level'];
  const sets = [];
  const values = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      values.push(key === 'polygon_geojson' ? JSON.stringify(req.body[key]) : req.body[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'No valid fields to update' });
  values.push(req.params.id);
  try {
    const result = await query(`UPDATE zones SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Zone not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteZone = async (req, res) => {
  try {
    const result = await query('DELETE FROM zones WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Zone not found' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};