import { useEffect, useState } from "react";

// Backend API base URL - set via VITE_API_URL at build time.
// Falls back to localhost for local development.
const API_URL = import.meta.env.VITE_API_URL || "";

// /api/patients is protected by a single shared HTTP Basic Auth
// credential (see terraform/auth.tf + app/backend/auth.js) - this is
// NOT per-user login, just a gate against anonymous internet traffic.
// The encoded credential is kept in sessionStorage only (cleared when
// the tab closes), never localStorage, and never logged.
function getStoredAuthHeader() {
  return sessionStorage.getItem("abc-auth-header");
}

function storeAuthHeader(username, password) {
  const header = `Basic ${btoa(`${username}:${password}`)}`;
  sessionStorage.setItem("abc-auth-header", header);
  return header;
}

function clearAuthHeader() {
  sessionStorage.removeItem("abc-auth-header");
}

function LoginForm({ onSubmit, error }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(username, password);
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "sans-serif", padding: "0 16px" }}>
      <h1 style={{ fontSize: 22 }}>ABC Healthcare — Sign in</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign in</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

function App() {
  const [authHeader, setAuthHeader] = useState(getStoredAuthHeader());
  const [authError, setAuthError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ full_name: "", date_of_birth: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  async function loadPatients(header) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/patients`, {
        headers: { Authorization: header },
      });
      if (res.status === 401) {
        clearAuthHeader();
        setAuthHeader(null);
        setAuthError("Session expired or invalid credentials - please sign in again.");
        return;
      }
      if (!res.ok) throw new Error("Failed to load patients");
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authHeader) loadPatients(authHeader);
  }, [authHeader]);

  function handleLogin(username, password) {
    setAuthError(null);
    const header = storeAuthHeader(username, password);
    setAuthHeader(header);
  }

  function handleSignOut() {
    clearAuthHeader();
    setAuthHeader(null);
    setPatients([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify(form),
      });
      if (res.status === 401) {
        clearAuthHeader();
        setAuthHeader(null);
        setAuthError("Session expired or invalid credentials - please sign in again.");
        return;
      }
      if (!res.ok) throw new Error("Failed to add patient");
      setForm({ full_name: "", date_of_birth: "", phone: "" });
      await loadPatients(authHeader);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!authHeader) {
    return <LoginForm onSubmit={handleLogin} error={authError} />;
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "sans-serif", padding: "0 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>ABC Healthcare — Patient Records</h1>
        <button onClick={handleSignOut} style={{ height: 32 }}>Sign out</button>
      </div>
      <p style={{ color: "#555" }}>
        AWS lift-and-shift prototype: React frontend → Express API on EC2 → RDS MySQL.
      </p>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2 style={{ fontSize: 18 }}>Add Patient</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            type="text"
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
          <input
            type="date"
            value={form.date_of_birth}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Add Patient"}
          </button>
        </div>
      </form>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {loading ? (
        <p>Loading patients...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #333" }}>
              <th>Name</th>
              <th>Date of Birth</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>{p.full_name}</td>
                <td>{p.date_of_birth}</td>
                <td>{p.phone || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
