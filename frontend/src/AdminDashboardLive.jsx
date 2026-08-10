import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { AlertTriangle, Wifi, WifiOff, Radio, Package, RefreshCw } from "lucide-react";

// ---------------------------------------------------------------------
// LIVE VERSION — Phase 8. Replaces admin-dashboard-shell.jsx's mock data
// with real calls to your backend:
//   GET  /api/v1/admin/analytics    (confirmed via analyticsRoutes.js)
//   GET  /api/v1/admin/all-tickets  (confirmed via analyticsRoutes.js)
//   WebSocket channels: 'bins', 'alerts'  (confirmed via streamWorker.js)
//
// Run `npm install socket.io-client` in your frontend project — this
// isn't in your backend's package.json, it's a separate frontend dep.
// ---------------------------------------------------------------------

const API_BASE = "http://localhost:3000"; // change when deployed

function FillGauge({ percent, size = "sm" }) {
  const color = percent >= 85 ? "var(--critical)" : percent >= 60 ? "var(--warn)" : "var(--ok)";
  const height = size === "sm" ? 28 : 44;
  const width = size === "sm" ? 10 : 14;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width, height, borderRadius: width / 2, border: "1.5px solid var(--line)", overflow: "hidden", background: "var(--surface2)", flexShrink: 0 }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${percent}%`, background: color, transition: "height 0.4s ease" }} />
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{percent}%</span>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    active: { color: "var(--ok)", icon: Wifi, label: "Active" },
    offline: { color: "var(--muted)", icon: WifiOff, label: "Offline" },
    full: { color: "var(--critical)", icon: AlertTriangle, label: "Full" },
    warning: { color: "var(--warn)", icon: AlertTriangle, label: "Warning" },
    maintenance: { color: "var(--muted)", icon: AlertTriangle, label: "Maintenance" },
  };
  const cfg = map[status] || map.offline;
  const Icon = cfg.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "var(--mono)", textTransform: "uppercase", color: cfg.color, border: `1px solid ${cfg.color}55`, background: `${cfg.color}14`, borderRadius: 20, padding: "3px 9px" }}>
      <Icon size={11} />{cfg.label}
    </span>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "16px 18px", flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontFamily: "var(--display)", fontWeight: 600, color: accent || "var(--text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboardLive({ token, user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [liveBins, setLiveBins] = useState({}); // keyed by bin_id, updated via socket
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, ticketsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/admin/analytics`, { headers }),
        fetch(`${API_BASE}/api/v1/admin/all-tickets`, { headers }),
      ]);
      if (!statsRes.ok || !ticketsRes.ok) throw new Error("Fetch failed — check token/role (needs admin)");
      setStats(await statsRes.json());
      setTickets(await ticketsRes.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live WebSocket connection — confirmed channel names: 'bins', 'alerts'
  useEffect(() => {
    if (!token) return;
    const socket = io(API_BASE, { transports: ["websocket"] });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("subscribe", "bins");
      socket.emit("subscribe", "alerts");
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on("bins", (bin) => {
      setLiveBins((prev) => ({ ...prev, [bin.id]: bin }));
    });
    socket.on("alerts", (alert) => {
      setLiveAlerts((prev) => [alert, ...prev].slice(0, 15)); // keep last 15
    });

    return () => socket.disconnect();
  }, [token]);

  const binList = Object.values(liveBins).sort(
    (a, b) => (b.priority_score || 0) - (a.priority_score || 0)
  );

  if (!token) return null; // App.jsx already guards this, shouldn't happen

  return (
    <div
      style={{
        "--bg": "#12161A", "--surface": "#181D22", "--surface2": "#20262C", "--line": "#2A3138",
        "--text": "#E7ECEF", "--muted": "#7C8894", "--ok": "#4FD1C5", "--warn": "#F2A65A", "--critical": "#E8594F",
        "--display": "'Space Grotesk', sans-serif", "--mono": "'JetBrains Mono', monospace",
        background: "var(--bg)", color: "var(--text)", fontFamily: "'Inter', sans-serif",
        minHeight: "100%", padding: 24, boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
            Smart Waste Bin Platform
          </div>
          <h1 style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 600, margin: 0 }}>Operations Dashboard</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)", background: "none", border: "1px solid var(--line)", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
            <RefreshCw size={12} /> {loading ? "Loading..." : "Refresh"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: connected ? "var(--ok)" : "var(--critical)", fontFamily: "var(--mono)" }}>
            <Radio size={13} /> {connected ? "LIVE" : "DISCONNECTED"}
          </div>
          <button onClick={onLogout} style={{ fontSize: 12, color: "var(--muted)", background: "none", border: "1px solid var(--line)", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
            Log out
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "var(--critical)14", border: "1px solid var(--critical)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: "var(--critical)" }}>
          {error}
        </div>
      )}

      {stats && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <StatCard label="Total Bins" value={stats.bins.total_bins} />
          <StatCard label="Full Bins" value={stats.bins.full_bins} accent="var(--critical)" />
          <StatCard label="Offline Bins" value={stats.bins.offline_bins} accent="var(--muted)" />
          <StatCard label="Low Battery" value={stats.bins.low_battery_bins} accent="var(--warn)" />
          <StatCard label="Active Alerts" value={stats.alerts.active_alerts} accent="var(--warn)" />
          <StatCard label="Trucks En Route" value={stats.trucks.active_trucks} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: 18 }}>
          <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
            Live Bin Updates ({binList.length})
          </div>
          {binList.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              No live updates yet — this list fills as MERN-A's ingestion sends real sensor readings through the WebSocket. Nothing wrong if it's empty right now.
            </p>
          ) : (
            binList.map((bin) => (
              <div key={bin.id} style={{ display: "grid", gridTemplateColumns: "100px 1fr 110px 90px", alignItems: "center", padding: "10px", fontSize: 13 }}>
                <span style={{ fontFamily: "var(--mono)" }}>{bin.bin_code}</span>
                <FillGauge percent={bin.current_fill_pct} />
                <StatusPill status={bin.status} />
                <span style={{ fontFamily: "var(--mono)" }}>{bin.priority_score ?? "-"}</span>
              </div>
            ))
          )}

          <div style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 15, marginBottom: 10 }}>
              Open Tickets ({tickets.length})
            </div>
            {tickets.slice(0, 8).map((t) => (
              <div key={t.id} style={{ fontSize: 12.5, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ color: "var(--warn)" }}>{t.type}</span> — {t.description || "no description"}
                <span style={{ color: "var(--muted)", marginLeft: 8 }}>({t.bin_code || t.bin_id})</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: 18 }}>
          <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Live Alerts</div>
          {liveAlerts.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted)" }}>No alerts received yet this session.</p>
          ) : (
            liveAlerts.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 10, borderBottom: "1px solid var(--line)" }}>
                <AlertTriangle size={14} color="var(--warn)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ fontSize: 12.5 }}>{a.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}