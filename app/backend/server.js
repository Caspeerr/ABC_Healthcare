require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initPool, getPool } = require("./db");
const { initAuth, requireAuth } = require("./auth");
const patientsRouter = require("./routes/patients");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// FRONTEND_URL is set by Terraform to the CloudFront distribution's
// own origin (see user_data.sh.tftpl). Falls back to allowing any
// origin only when unset, e.g. local development.
const allowedOrigin = process.env.FRONTEND_URL;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json());

// Health check - used by the ALB target group to confirm the
// instance is actually up before routing traffic to it.
// Return HTTP 200 even during startup or transient DB issues so the
// ALB does not mark the target unhealthy while the service is still
// becoming ready.
app.get("/api/health", async (req, res) => {
  try {
    if (!process.env.DB_HOST || !process.env.DB_NAME) {
      return res.status(200).json({ status: "ok", database: "not-configured" });
    }

    const pool = getPool();
    await pool.query("SELECT 1");
    return res.status(200).json({ status: "ok", database: "connected" });
  } catch (err) {
    return res.status(200).json({
      status: "ok",
      database: "unreachable",
      note: "Application is running; database check failed",
    });
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
  app.listen(PORT, HOST, () => {
    console.log(`ABC Healthcare backend listening on ${HOST}:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
