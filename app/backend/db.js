const mysql = require("mysql2/promise");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

// Connection pool to RDS MySQL. Lazily created by initPool() so the
// app can fetch real credentials before anything tries to query the
// database. Two modes are supported:
//
//   Production (EC2): DB_SECRET_ARN is set by Terraform's user_data,
//   so credentials (username, password, database) are fetched from
//   AWS Secrets Manager at startup. Only the RDS host/port ever come
//   from a plain environment variable - the actual password is never
//   written to disk, a config file, or a GitHub secret.
//
//   Local development: DB_SECRET_ARN is not set, so the pool falls
//   back to plain DB_USER/DB_PASSWORD/DB_NAME environment variables
//   from a local .env file, exactly as before.
let pool;

async function fetchSecret(secretArn, region) {
  const client = new SecretsManagerClient({ region });
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));
  return JSON.parse(response.SecretString);
}

async function initPool() {
  if (pool) return pool;

  let dbConfig;

  if (process.env.DB_SECRET_ARN) {
    const region = process.env.AWS_REGION || "ap-south-1";
    console.log(`Fetching database credentials from Secrets Manager (${region})...`);
    const secret = await fetchSecret(process.env.DB_SECRET_ARN, region);
    dbConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: secret.username,
      password: secret.password,
      database: secret.database,
    };
  } else {
    dbConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };
  }

  pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error("Database pool not initialized - call initPool() before getPool().");
  }
  return pool;
}

module.exports = { initPool, getPool };
