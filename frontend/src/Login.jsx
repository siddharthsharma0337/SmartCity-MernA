import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("citizen");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isRegister ? `${API_BASE}/auth/register` : `${API_BASE}/auth/login`;
      const body = isRegister
        ? { name, email, password, phone, role }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${isRegister ? "Registration" : "Login"} failed`);

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
      <form onSubmit={handleSubmit} style={{ background: "#181D22", border: "1px solid #2A3138", borderRadius: 12, padding: 32, width: 360, boxSizing: "border-box" }}>
        <div style={{ fontSize: 11, color: "#7C8894", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          Smart Waste Bin Platform
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", marginTop: 0, marginBottom: 20 }}>
          {isRegister ? "Create an account" : "Sign in"}
        </h2>

        {error && (
          <div style={{ background: "#E8594F14", border: "1px solid #E8594F", borderRadius: 6, padding: 10, fontSize: 13, color: "#E8594F", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {isRegister && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 6, border: "1px solid #2A3138", background: "#20262C", color: "#E7ECEF", boxSizing: "border-box" }}
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 6, border: "1px solid #2A3138", background: "#20262C", color: "#E7ECEF", boxSizing: "border-box" }}
            />
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, color: "#7C8894", marginBottom: 4 }}>Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #2A3138", background: "#20262C", color: "#E7ECEF", boxSizing: "border-box" }}
              >
                <option value="citizen">Citizen</option>
                <option value="driver">Driver</option>
                <option value="maintenance">Maintenance</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </>
        )}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 6, border: "1px solid #2A3138", background: "#20262C", color: "#E7ECEF", boxSizing: "border-box" }}
        />
        <input
          type="password"
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ width: "100%", padding: 10, marginBottom: 20, borderRadius: 6, border: "1px solid #2A3138", background: "#20262C", color: "#E7ECEF", boxSizing: "border-box" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 11, borderRadius: 6, border: "none", background: "#4FD1C5", color: "#12161A", fontWeight: 600, cursor: "pointer", marginBottom: 14 }}
        >
          {loading ? (isRegister ? "Creating account..." : "Signing in...") : (isRegister ? "Create Account" : "Sign in")}
        </button>

        <div style={{ textAlign: "center", fontSize: 13, color: "#7C8894" }}>
          {isRegister ? (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(""); }}
                style={{ background: "none", border: "none", color: "#4FD1C5", cursor: "pointer", textDecoration: "underline", padding: 0 }}
              >
                Sign in
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(""); }}
                style={{ background: "none", border: "none", color: "#4FD1C5", cursor: "pointer", textDecoration: "underline", padding: 0 }}
              >
                Register
              </button>
            </span>
          )}
        </div>
      </form>
    </div>
  );
}