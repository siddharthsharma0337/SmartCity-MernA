import React, { useState, useEffect } from "react";
import Login from "./Login.jsx";
import AdminDashboardLive from "./AdminDashboardLive.jsx"; // rename admin-dashboard-live.jsx to this when you drop it in

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Restore session on refresh — no need to log in every time you reload
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  if (!token) return <Login onLogin={handleLogin} />;

  // Only admins should see the dashboard — everyone else gets a plain message
  if (user?.role !== "admin") {
    return (
      <div style={{ background: "#12161A", color: "#E7ECEF", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <div>
          <p>Signed in as {user?.name} ({user?.role}) — dashboard is admin-only.</p>
          <button onClick={handleLogout} style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #2A3138", background: "none", color: "#E7ECEF", cursor: "pointer" }}>
            Log out
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboardLive token={token} user={user} onLogout={handleLogout} />;
}