const pool = require("../src/db/pool");

async function upsertLeague(client, league) {
  const { rows } = await client.query(
    `
      INSERT INTO leagues (code, name)
      VALUES ($1, $2)
      ON CONFLICT (code)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `,
    [league.code, league.name]
  );

  return rows[0].id;
}

async function upsertSeason(client, season) {
  const { rows } = await client.query(
    `
      INSERT INTO seasons (league_id, name)
      VALUES ($1, $2)
      ON CONFLICT (league_id, name)
      DO NOTHING
      RETURNING id
    `,
    [season.leagueId, season.name]
  );

  if (rows[0]) {
    return rows[0].id;
  }

  const existing = await client.query(
    "SELECT id FROM seasons WHERE league_id = $1 AND name = $2",
    [season.leagueId, season.name]
  );

  return existing.rows[0].id;
}

async function upsertTeam(client, team) {
  const { rows } = await client.query(
    `
      INSERT INTO teams (league_id, name, short_name, logo_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (league_id, name)
      DO UPDATE
      SET short_name = EXCLUDED.short_name,
          logo_url = EXCLUDED.logo_url
      RETURNING id
    `,
    [team.leagueId, team.name, team.shortName, team.logoUrl || null]
  );

  return rows[0].id;
}

async function upsertPlayer(client, player) {
  const { rows } = await client.query(
    `
      INSERT INTO players (league_id, team_id, name, player_type, position)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (team_id, name)
      DO UPDATE
      SET player_type = EXCLUDED.player_type,
          position = EXCLUDED.position
      RETURNING id
    `,
    [player.leagueId, player.teamId, player.name, player.playerType, player.position]
  );

  return rows[0].id;
}

async function upsertGame(client, game) {
  const { rows } = await client.query(
    `
      INSERT INTO games (
        league_id,
        season_id,
        external_game_id,
        game_date,
        game_time,
        home_team_id,
        away_team_id,
        status,
        home_score,
        away_score
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (league_id, external_game_id)
      DO UPDATE
      SET season_id = EXCLUDED.season_id,
          game_date = EXCLUDED.game_date,
          game_time = EXCLUDED.game_time,
          home_team_id = EXCLUDED.home_team_id,
          away_team_id = EXCLUDED.away_team_id,
          status = EXCLUDED.status,
          home_score = EXCLUDED.home_score,
          away_score = EXCLUDED.away_score
      RETURNING id
    `,
    [
      game.leagueId,
      game.seasonId,
      game.externalGameId,
      game.gameDate,
      game.gameTime,
      game.homeTeamId,
      game.awayTeamId,
      game.status,
      game.homeScore,
      game.awayScore
    ]
  );

  return rows[0].id;
}

async function upsertGameTeamStats(client, stats) {
  await client.query(
    `
      INSERT INTO game_team_stats (
        game_id,
        team_id,
        points,
        rebounds,
        assists,
        turnovers,
        local_points,
        import_points,
        offensive_rating,
        defensive_rating,
        net_rating
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (game_id, team_id)
      DO UPDATE
      SET points = EXCLUDED.points,
          rebounds = EXCLUDED.rebounds,
          assists = EXCLUDED.assists,
          turnovers = EXCLUDED.turnovers,
          local_points = EXCLUDED.local_points,
          import_points = EXCLUDED.import_points,
          offensive_rating = EXCLUDED.offensive_rating,
          defensive_rating = EXCLUDED.defensive_rating,
          net_rating = EXCLUDED.net_rating
    `,
    [
      stats.gameId,
      stats.teamId,
      stats.points,
      stats.rebounds,
      stats.assists,
      stats.turnovers,
      stats.localPoints,
      stats.importPoints,
      stats.offensiveRating,
      stats.defensiveRating,
      stats.netRating
    ]
  );
}

async function upsertGamePlayerStats(client, stats) {
  await client.query(
    `
      INSERT INTO game_player_stats (
        game_id,
        team_id,
        player_id,
        minutes,
        points,
        rebounds,
        assists,
        steals,
        blocks,
        turnovers,
        plus_minus,
        true_shooting_percentage,
        usage_percentage
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (game_id, player_id)
      DO UPDATE
      SET minutes = EXCLUDED.minutes,
          points = EXCLUDED.points,
          rebounds = EXCLUDED.rebounds,
          assists = EXCLUDED.assists,
          steals = EXCLUDED.steals,
          blocks = EXCLUDED.blocks,
          turnovers = EXCLUDED.turnovers,
          plus_minus = EXCLUDED.plus_minus,
          true_shooting_percentage = EXCLUDED.true_shooting_percentage,
          usage_percentage = EXCLUDED.usage_percentage
    `,
    [
      stats.gameId,
      stats.teamId,
      stats.playerId,
      stats.minutes,
      stats.points,
      stats.rebounds,
      stats.assists,
      stats.steals,
      stats.blocks,
      stats.turnovers,
      stats.plusMinus,
      stats.trueShootingPercentage,
      stats.usagePercentage
    ]
  );
}

async function run() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const plgId = await upsertLeague(client, { code: "PLG", name: "P. LEAGUE+" });
    const tpblId = await upsertLeague(client, { code: "TPBL", name: "Taiwan Professional Basketball League" });
    const plgSeasonId = await upsertSeason(client, { leagueId: plgId, name: "2025-26" });
    await upsertSeason(client, { leagueId: tpblId, name: "2025-26" });

    const bravesId = await upsertTeam(client, {
      leagueId: plgId,
      name: "Taipei Fubon Braves",
      shortName: "Braves"
    });
    const pilotsId = await upsertTeam(client, {
      leagueId: plgId,
      name: "Taoyuan Pauian Pilots",
      shortName: "Pilots"
    });
    await upsertTeam(client, {
      leagueId: tpblId,
      name: "New Taipei Kings",
      shortName: "Kings"
    });

    const playerId = await upsertPlayer(client, {
      leagueId: plgId,
      teamId: bravesId,
      name: "Sample Guard",
      playerType: "local",
      position: "G"
    });

    const gameId = await upsertGame(client, {
      leagueId: plgId,
      seasonId: plgSeasonId,
      externalGameId: "PLG-2025-26-001",
      gameDate: "2026-01-10",
      gameTime: "19:00:00",
      homeTeamId: bravesId,
      awayTeamId: pilotsId,
      status: "scheduled",
      homeScore: null,
      awayScore: null
    });

    await upsertGameTeamStats(client, {
      gameId,
      teamId: bravesId,
      points: 0,
      rebounds: 0,
      assists: 0,
      turnovers: 0,
      localPoints: 0,
      importPoints: 0,
      offensiveRating: null,
      defensiveRating: null,
      netRating: null
    });

    await upsertGamePlayerStats(client, {
      gameId,
      teamId: bravesId,
      playerId,
      minutes: 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      plusMinus: 0,
      trueShootingPercentage: null,
      usagePercentage: null
    });

    await client.query("COMMIT");
    console.log("Seed data inserted");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
