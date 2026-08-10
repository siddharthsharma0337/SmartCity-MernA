import React, { useState } from "react";

const API_BASE = "http://localhost:3000"; // change when deployed

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#12161A", color: "#E7ECEF", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
      <form onSubmit={handleSubmit} style={{ background: "#181D22", border: "1px solid #2A3138", borderRadius: 12, padding: 32, width: 340 }}>
        <div style={{ fontSize: 11, color: "#7C8894", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          Smart Waste Bin Platform
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", marginTop: 0, marginBottom: 24 }}>Sign in</h2>

        {error && (
          <div style={{ background: "#E8594F14", border: "1px solid #E8594F", borderRadius: 6, padding: 10, fontSize: 13, color: "#E8594F", marginBottom: 16 }}>
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 6, border: "1px solid #2A3138", background: "#20262C", color: "#E7ECEF", boxSizing: "border-box" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: 10, marginBottom: 20, borderRadius: 6, border: "1px solid #2A3138", background: "#20262C", color: "#E7ECEF", boxSizing: "border-box" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 11, borderRadius: 6, border: "none", background: "#4FD1C5", color: "#12161A", fontWeight: 600, cursor: "pointer" }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}