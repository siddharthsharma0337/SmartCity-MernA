import bcrypt from 'bcrypt';
import { query } from '../config/db.js';

// Per doc 2, MERN-B Step 2: "GET/POST /api/v1/bins, /users, /trucks, /zones"
// — user creation belongs here, not in authController.js (which only
// owns login/logout per the doc). This is also how you'd create the
// first driver/citizen/maintenance accounts going forward, instead of
// manually inserting via SQL every time.

export const createUser = async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are required' });
  }
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, role, status, created_at`, // never return password_hash
      [name, email, phone || null, password_hash, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  const allowed = ['name', 'phone', 'role', 'status'];
  const sets = [];
  const values = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      values.push(req.body[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'No valid fields to update' });
  sets.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);
  try {
    const result = await query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${values.length}
       RETURNING id, name, email, phone, role, status, updated_at`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};