const dotenv = require("dotenv");

dotenv.config({ quiet: true });

function readBoolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes"].includes(String(value).toLowerCase());
}

const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  db: {
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5433),
    database: process.env.DB_NAME || "taiwan_basketball",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    ssl: readBoolean(process.env.DB_SSL, false)
  }
};

module.exports = config;
