require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const patientsRouter = require("./routes/patients");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check - used by the ALB target group to confirm the
// instance is actually up before routing traffic to it.
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", database: "unreachable" });
  }
});

app.use("/api/patients", patientsRouter);

app.listen(PORT, () => {
  console.log(`ABC Healthcare backend listening on port ${PORT}`);
});
