require("dotenv").config();

const pool = require("../src/db/pool");

const BATCH_SIZE = Number(process.env.PLAYER_HALF_PLUS_MINUS_BACKFILL_BATCH_SIZE || 500);

async function backfillBatch(client) {
  const { rowCount } = await client.query(
    `
      WITH target AS (
        SELECT
          gphs.id,
          calculated.plus_minus
        FROM game_player_half_stats gphs
        CROSS JOIN LATERAL (
          SELECT calculate_player_half_plus_minus(
            gphs.game_id,
            gphs.player_id,
            gphs.half
          ) AS plus_minus
        ) calculated
        WHERE calculated.plus_minus IS NOT NULL
          AND gphs.plus_minus IS DISTINCT FROM calculated.plus_minus
        ORDER BY gphs.id
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE game_player_half_stats gphs
      SET plus_minus = target.plus_minus
      FROM target
      WHERE gphs.id = target.id
    `,
    [BATCH_SIZE]
  );

  return rowCount;
}

async function run() {
  const client = await pool.connect();
  let totalUpdated = 0;

  try {
    while (true) {
      const updated = await backfillBatch(client);

      totalUpdated += updated;

      if (updated === 0) {
        break;
      }

      console.log(`Updated ${totalUpdated} player half plusMinus rows`);
    }

    console.log(`Backfill complete. Updated rows: ${totalUpdated}`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
