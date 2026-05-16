const pool = require("../src/db/pool");

const teams = [
  {
    name: "臺北富邦勇士",
    shortName: "勇士",
    logoFileName: "富邦勇士.webp"
  },
  {
    name: "桃園璞園領航猿",
    shortName: "領航猿",
    logoFileName: "桃園領航猿.webp"
  },
  {
    name: "洋基工程",
    shortName: "洋基工程",
    logoFileName: "新竹楊機工程.webp"
  },
  {
    name: "台鋼獵鷹",
    shortName: "獵鷹",
    logoFileName: "台南獵鷹.webp"
  }
];

function publicUrlFor(fileName) {
  return `/${encodeURI(fileName)}`;
}

async function upsertLeague(client) {
  const { rows } = await client.query(
    `
      INSERT INTO leagues (code, name)
      VALUES ($1, $2)
      ON CONFLICT (code)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `,
    ["PLG", "P. LEAGUE+"]
  );

  return rows[0].id;
}

async function upsertTeam(client, leagueId, team) {
  const logoUrl = publicUrlFor(team.logoFileName);
  const { rows } = await client.query(
    `
      INSERT INTO teams (league_id, name, short_name, logo_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (league_id, name)
      DO UPDATE
      SET short_name = EXCLUDED.short_name,
          logo_url = EXCLUDED.logo_url
      RETURNING id, league_id, name, short_name, logo_url
    `,
    [leagueId, team.name, team.shortName, logoUrl]
  );

  return rows[0];
}

async function run() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const leagueId = await upsertLeague(client);
    const importedTeams = [];

    for (const team of teams) {
      importedTeams.push(await upsertTeam(client, leagueId, team));
    }

    await client.query("COMMIT");

    console.log(JSON.stringify(importedTeams, null, 2));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
