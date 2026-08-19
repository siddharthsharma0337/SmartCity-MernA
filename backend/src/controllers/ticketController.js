import { query } from '../config/db.js';

// His `tickets` table covers overflow / offline / damage / complaint —
// broader than "complaints". This replaces complaintController.js entirely.
export const createTicket = async (req, res) => {
  const { ticket_code, bin_id, type, description, photo_url } = req.body;
  const created_by_user_id = req.user?.id || null; // from authenticate middleware
  try {
    const result = await query(
      `INSERT INTO tickets (ticket_code, created_by_user_id, bin_id, type, description, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [ticket_code, created_by_user_id, bin_id, type, description || null, photo_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const listTickets = async (req, res) => {
  const { status, type, bin_id } = req.query;
  const clauses = [];
  const values = [];
  if (status) { values.push(status); clauses.push(`status = $${values.length}`); }
  if (type) { values.push(type); clauses.push(`type = $${values.length}`); }
  if (bin_id) { values.push(bin_id); clauses.push(`bin_id = $${values.length}`); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  try {
    const result = await query(`SELECT * FROM tickets ${where} ORDER BY created_at DESC`, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTicket = async (req, res) => {
  try {
    const result = await query('SELECT * FROM tickets WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Ticket not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateTicket = async (req, res) => {
  // status/assignment — the admin/maintenance-side actions
  const allowed = ['status', 'assigned_to_user_id'];
  const sets = [];
  const values = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      values.push(req.body[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'No valid fields to update' });
  sets.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(req.params.id);
  try {
    const result = await query(`UPDATE tickets SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Ticket not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const result = await query('DELETE FROM tickets WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Ticket not found' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};