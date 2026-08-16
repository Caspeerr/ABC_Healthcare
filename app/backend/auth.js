const crypto = require("crypto");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

// Gates /api routes behind a single shared HTTP Basic Auth credential.
// This is NOT per-user authentication - it just stops anonymous
// internet traffic from reading/writing patient records. Swap this
// for Cognito or JWT-based login for real multi-user auth.
//
//   Production (EC2): API_AUTH_SECRET_ARN is set, so the username/
//   password are fetched from Secrets Manager at startup.
//
//   Local development: API_AUTH_SECRET_ARN is not set, so the
//   middleware falls back to plain API_AUTH_USER/API_AUTH_PASSWORD
//   env vars (see .env.example), or is skipped entirely if neither
//   is set, so local dev doesn't require any setup.

let credentials; // { username, password } | null

async function fetchSecret(secretArn, region) {
  const client = new SecretsManagerClient({ region });
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));
  return JSON.parse(response.SecretString);
}

async function initAuth() {
  if (credentials !== undefined) return credentials;

  if (process.env.API_AUTH_SECRET_ARN) {
    const region = process.env.AWS_REGION || "ap-south-1";
    console.log(`Fetching API auth credentials from Secrets Manager (${region})...`);
    credentials = await fetchSecret(process.env.API_AUTH_SECRET_ARN, region);
  } else if (process.env.API_AUTH_USER && process.env.API_AUTH_PASSWORD) {
    credentials = { username: process.env.API_AUTH_USER, password: process.env.API_AUTH_PASSWORD };
  } else {
    console.warn("API_AUTH_SECRET_ARN not set and no local API_AUTH_USER/PASSWORD - /api routes are UNPROTECTED.");
    credentials = null;
  }

  return credentials;
}

function timingSafeStringEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function requireAuth(req, res, next) {
  if (!credentials) return next(); // not configured (local dev with nothing set) - fail open, logged loudly above

  const header = req.headers.authorization || "";
  const [scheme, encoded] = header.split(" ");

  if (scheme !== "Basic" || !encoded) {
    res.set("WWW-Authenticate", 'Basic realm="ABC Healthcare API"');
    return res.status(401).json({ error: "Authentication required" });
  }

  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");
  const user = decoded.slice(0, separatorIndex);
  const pass = decoded.slice(separatorIndex + 1);

  const userOk = timingSafeStringEqual(user, credentials.username);
  const passOk = timingSafeStringEqual(pass, credentials.password);

  if (!userOk || !passOk) {
    res.set("WWW-Authenticate", 'Basic realm="ABC Healthcare API"');
    return res.status(401).json({ error: "Invalid credentials" });
  }

  next();
}

module.exports = { initAuth, requireAuth };
