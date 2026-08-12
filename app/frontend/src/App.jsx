import { useEffect, useState } from "react";

// Backend API base URL - set via VITE_API_URL at build time.
// Falls back to localhost for local development.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ full_name: "", date_of_birth: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  async function loadPatients() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/patients`);
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
    loadPatients();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add patient");
      setForm({ full_name: "", date_of_birth: "", phone: "" });
      await loadPatients();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "sans-serif", padding: "0 16px" }}>
      <h1>ABC Healthcare — Patient Records</h1>
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
