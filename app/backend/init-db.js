require("dotenv").config();
const fs = require("fs");
const mysql = require("mysql2/promise");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

async function main() {
  let cfg;
  if (process.env.DB_SECRET_ARN) {
    const client = new SecretsManagerClient({ region: process.env.AWS_REGION || "ap-south-1" });
    const response = await client.send(new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }));
    const secret = JSON.parse(response.SecretString);
    cfg = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: secret.username,
      password: secret.password,
      database: secret.database
    };
  } else {
    cfg = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    };
  }

  const sql = fs.readFileSync(__dirname + "/schema.sql", "utf8");
  const connection = await mysql.createConnection(cfg);
  for (const statement of sql.split(";").map(s => s.trim()).filter(Boolean)) {
    await connection.query(statement);
  }
  await connection.end();
  console.log("Database schema initialized.");
}

main().catch(err => {
  console.error("Database initialization failed:", err);
  process.exit(1);
});
