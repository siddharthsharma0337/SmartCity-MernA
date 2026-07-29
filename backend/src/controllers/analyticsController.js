import { query } from '../config/db.js';

export const getAggregatedStats = async (req, res) => {
  try {
    const stats = {};
    
    const binsRes = await query(`
      SELECT 
        COUNT(*) as total_bins,
        COUNT(CASE WHEN status = 'full' THEN 1 END) as full_bins,
        COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline_bins,
        COUNT(CASE WHEN battery_pct < 20 THEN 1 END) as low_battery_bins
      FROM bins
    `);
    stats.bins = binsRes.rows[0];

    const alertsRes = await query(`
      SELECT COUNT(*) as active_alerts 
      FROM alerts 
      WHERE resolved = FALSE
    `);
    stats.alerts = alertsRes.rows[0];

    const trucksRes = await query(`
      SELECT COUNT(*) as active_trucks 
      FROM trucks 
      WHERE status = 'on_route'
    `);
    stats.trucks = trucksRes.rows[0];

    res.json(stats);
  } catch (error) {
    console.error('Analytics stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllOpenTickets = async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, u.name as reporter_name, b.bin_code 
      FROM tickets t
      LEFT JOIN users u ON t.created_by_user_id = u.id
      LEFT JOIN bins b ON t.bin_id = b.id
      WHERE t.status IN ('open', 'assigned')
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
