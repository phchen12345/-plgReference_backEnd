const createApp = require("./app");
const config = require("./config/env");
const pool = require("./db/pool");

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`API server running on http://localhost:${config.port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Closing server...`);

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
