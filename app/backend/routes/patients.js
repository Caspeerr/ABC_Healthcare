const express = require("express");
const router = express.Router();
const { getPool } = require("../db");

// GET /api/patients - list all patients, most recent first
router.get("/", async (req, res) => {
  try {
    const [rows] = await getPool().query(
      "SELECT id, full_name, date_of_birth, phone, created_at FROM patients ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching patients:", err.message);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

// POST /api/patients - add a new patient
router.post("/", async (req, res) => {
  const { full_name, date_of_birth, phone } = req.body;

  if (!full_name || !date_of_birth) {
    return res.status(400).json({ error: "full_name and date_of_birth are required" });
  }

  try {
    const [result] = await getPool().query(
      "INSERT INTO patients (full_name, date_of_birth, phone) VALUES (?, ?, ?)",
      [full_name, date_of_birth, phone || null]
    );
    res.status(201).json({ id: result.insertId, full_name, date_of_birth, phone });
  } catch (err) {
    console.error("Error adding patient:", err.message);
    res.status(500).json({ error: "Failed to add patient" });
  }
});

module.exports = router;
