const { Client } = require("pg");

const config = require("../src/config/env");

function quoteIdentifier(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error("DB_NAME must use only letters, numbers, and underscores, and cannot start with a number");
  }

  return `"${value.replace(/"/g, '""')}"`;
}

async function run() {
  const dbName = config.db.database;
  const client = new Client({
    host: config.db.host,
    port: config.db.port,
    database: "postgres",
    user: config.db.user,
    password: config.db.password,
    ssl: config.db.ssl ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();

    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);

    if (result.rowCount > 0) {
      console.log(`Database already exists: ${dbName}`);
      return;
    }

    await client.query(`CREATE DATABASE ${quoteIdentifier(dbName)}`);
    console.log(`Database created: ${dbName}`);
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error.code ? `${error.code}: ${error.message}` : error.message);
  process.exitCode = 1;
});
