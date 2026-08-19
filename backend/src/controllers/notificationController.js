import { query } from '../config/db.js';

// Not a route — a helper other controllers call directly (e.g. dispatch
// notifying a driver). channel/title/body match his notifications table
// exactly: channel CHECK IN ('push','sms','email','inapp').
export const createNotification = async ({ userId, alertId = null, channel = 'inapp', title, body }) => {
  const result = await query(
    `INSERT INTO notifications (user_id, alert_id, channel, title, body)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, alertId, channel, title, body]
  );
  return result.rows[0];
};

export const listMyNotifications = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    // ownership check via WHERE user_id — can't mark someone else's notification read
    const result = await query(
      'UPDATE notifications SET read_status = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Notification not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};