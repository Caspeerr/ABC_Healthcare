require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initPool, getPool } = require("./db");
const { initAuth, requireAuth } = require("./auth");
const patientsRouter = require("./routes/patients");

const app = express();
const PORT = process.env.PORT || 3000;

// FRONTEND_URL is set by Terraform to the CloudFront distribution's
// own origin (see user_data.sh.tftpl). Falls back to allowing any
// origin only when unset, e.g. local development.
const allowedOrigin = process.env.FRONTEND_URL;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json());

// Health check - used by the ALB target group to confirm the
// instance is actually up before routing traffic to it.
app.get("/api/health", async (req, res) => {
  try {
    await getPool().query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", database: "unreachable" });
  }
});

app.use("/api/patients", requireAuth, patientsRouter);

// The database pool and auth credentials are both loaded (fetching
// real values from Secrets Manager, if configured) before the server
// starts accepting requests, so nothing can hit /api/patients before
// both the database connection and the auth check are actually ready.
async function start() {
  await initPool();
  await initAuth();
  app.listen(PORT, () => {
    console.log(`ABC Healthcare backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
