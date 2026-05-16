const AppError = require("../errors/AppError");
const { query, queryOne } = require("../db/query");

const REFEREE_TITLES = {
  chief: "\u4e3b\u88c1\u5224",
  first_inspector: "\u7b2c\u4e00\u6aa2\u67e5\u54e1",
  second_inspector: "\u7b2c\u4e8c\u6aa2\u67e5\u54e1"
};

function mapGame(row) {
  return {
    id: row.id,
    leagueId: row.league_id,
    seasonId: row.season_id,
    externalGameId: row.external_game_id,
    gameCode: row.game_code,
    gameDate: row.game_date,
    gameTime: row.game_time,
    venue: row.venue,
    attendance: row.attendance,
    capacity: row.capacity,
    stage: row.stage,
    status: row.status,
    homeScore: row.home_score,
    awayScore: row.away_score,
    league: {
      id: row.league_id,
      code: row.league_code,
      name: row.league_name
    },
    season: {
      id: row.season_id,
      name: row.season_name
    },
    homeTeam: {
      id: row.home_team_id,
      name: row.home_team_name,
      shortName: row.home_team_short_name,
      logoUrl: row.home_team_logo_url
    },
    awayTeam: {
      id: row.away_team_id,
      name: row.away_team_name,
      shortName: row.away_team_short_name,
      logoUrl: row.away_team_logo_url
    }
  };
}

function mapReferee(row) {
  return {
    role: row.role,
    title: REFEREE_TITLES[row.role] || row.role,
    name: row.name,
    sortOrder: row.sort_order
  };
}

function toNullableNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function formatMinutes(value) {
  const number = toNullableNumber(value);

  if (number === null) {
    return null;
  }

  const totalSeconds = Math.round(number * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function mapTeamStat(row) {
  if (!row) {
    return null;
  }

  return {
    points: toNullableNumber(row.points),
    rebounds: toNullableNumber(row.rebounds),
    assists: toNullableNumber(row.assists),
    steals: toNullableNumber(row.steals),
    blocks: toNullableNumber(row.blocks),
    turnovers: toNullableNumber(row.turnovers),
    offensiveRebounds: toNullableNumber(row.offensive_rebounds),
    defensiveRebounds: toNullableNumber(row.defensive_rebounds),
    personalFouls: toNullableNumber(row.personal_fouls),
    efficiency: toNullableNumber(row.efficiency),
    localPoints: toNullableNumber(row.local_points),
    importPoints: toNullableNumber(row.import_points),
    fsPoints: toNullableNumber(row.fs_points),
    pointsInPaint: toNullableNumber(row.points_in_paint),
    pointsFromSecondChance: toNullableNumber(row.points_from_second_chance),
    pointsFromFastbreak: toNullableNumber(row.points_from_fastbreak),
    twoPointsMade: toNullableNumber(row.two_points_made),
    twoPointsAttempted: toNullableNumber(row.two_points_attempted),
    twoPointsPercentage: toNullableNumber(row.two_points_percentage),
    threePointsMade: toNullableNumber(row.three_points_made),
    threePointsAttempted: toNullableNumber(row.three_points_attempted),
    threePointsPercentage: toNullableNumber(row.three_points_percentage),
    freeThrowsMade: toNullableNumber(row.free_throws_made),
    freeThrowsAttempted: toNullableNumber(row.free_throws_attempted),
    freeThrowsPercentage: toNullableNumber(row.free_throws_percentage),
    offensiveRating: toNullableNumber(row.offensive_rating),
    defensiveRating: toNullableNumber(row.defensive_rating),
    netRating: toNullableNumber(row.net_rating)
  };
}

function mapPlayer(row) {
  return {
    id: row.player_id,
    teamId: row.team_id,
    name: row.player_name,
    playerType: row.player_type,
    position: row.position,
    officialPlayerId: row.official_player_id,
    personId: row.person_id,
    randomId: row.random_id,
    englishName: row.english_name,
    jerseyNumber: row.jersey_number
  };
}

function mapPlayerStat(row) {
  if (!row) {
    return null;
  }

  return {
    minutes: formatMinutes(row.minutes),
    points: toNullableNumber(row.points),
    rebounds: toNullableNumber(row.rebounds),
    assists: toNullableNumber(row.assists),
    steals: toNullableNumber(row.steals),
    blocks: toNullableNumber(row.blocks),
    turnovers: toNullableNumber(row.turnovers),
    plusMinus: toNullableNumber(row.plus_minus),
    trueShootingPercentage: toNullableNumber(row.true_shooting_percentage),
    effectiveFieldGoalPercentage: toNullableNumber(row.effective_field_goal_percentage),
    threePointAttemptRate: toNullableNumber(row.three_point_attempt_rate),
    freeThrowRate: toNullableNumber(row.free_throw_rate),
    offensiveReboundPercentage: toNullableNumber(row.offensive_rebound_percentage),
    defensiveReboundPercentage: toNullableNumber(row.defensive_rebound_percentage),
    totalReboundPercentage: toNullableNumber(row.total_rebound_percentage),
    assistPercentage: toNullableNumber(row.assist_percentage),
    stealPercentage: toNullableNumber(row.steal_percentage),
    blockPercentage: toNullableNumber(row.block_percentage),
    turnoverPercentage: toNullableNumber(row.turnover_percentage),
    usagePercentage: toNullableNumber(row.usage_percentage),
    starter: Boolean(row.starter),
    twoPointsMade: toNullableNumber(row.two_points_made),
    twoPointsAttempted: toNullableNumber(row.two_points_attempted),
    twoPointsPercentage: toNullableNumber(row.two_points_percentage),
    threePointsMade: toNullableNumber(row.three_points_made),
    threePointsAttempted: toNullableNumber(row.three_points_attempted),
    threePointsPercentage: toNullableNumber(row.three_points_percentage),
    freeThrowsMade: toNullableNumber(row.free_throws_made),
    freeThrowsAttempted: toNullableNumber(row.free_throws_attempted),
    freeThrowsPercentage: toNullableNumber(row.free_throws_percentage),
    offensiveRebounds: toNullableNumber(row.offensive_rebounds),
    defensiveRebounds: toNullableNumber(row.defensive_rebounds),
    personalFouls: toNullableNumber(row.personal_fouls),
    efficiency: toNullableNumber(row.efficiency),
    assistRatio: toNullableNumber(row.assist_ratio),
    turnoverRatio: toNullableNumber(row.turnover_ratio),
    offensiveRating: toNullableNumber(row.offensive_rating),
    defensiveRating: toNullableNumber(row.defensive_rating),
    netRating: toNullableNumber(row.net_rating),
    gameScore: toNullableNumber(row.game_score),
    offensivePossessions: toNullableNumber(row.offensive_possessions),
    opponentOffensivePossessions: toNullableNumber(row.opponent_offensive_possessions),
    opponentPointsFromSecondChance: toNullableNumber(row.opponent_points_from_second_chance),
    opponentPointsFromFastbreak: toNullableNumber(row.opponent_points_from_fastbreak),
    opponentPointsFromTurnover: toNullableNumber(row.opponent_points_from_turnover),
    opponentPointsInPaint: toNullableNumber(row.opponent_points_in_paint),
    pace: toNullableNumber(row.pace)
  };
}

function buildTeamBoxscore(
  team,
  teamStatsRows,
  teamPeriodRows,
  teamHalfRows,
  playerStatRows,
  playerPeriodRows,
  playerHalfRows
) {
  const teamStats = teamStatsRows.find((row) => row.team_id === team.id);
  const playersById = new Map();

  for (const row of playerStatRows.filter((statRow) => statRow.team_id === team.id)) {
    playersById.set(row.player_id, {
      player: mapPlayer(row),
      stats: mapPlayerStat(row),
      periods: [],
      halves: []
    });
  }

  for (const row of playerPeriodRows.filter((periodRow) => periodRow.team_id === team.id)) {
    if (!playersById.has(row.player_id)) {
      playersById.set(row.player_id, {
        player: mapPlayer(row),
        stats: null,
        periods: [],
        halves: []
      });
    }

    playersById.get(row.player_id).periods.push({
      period: row.period,
      stats: mapPlayerStat(row)
    });
  }

  for (const row of playerHalfRows.filter((halfRow) => halfRow.team_id === team.id)) {
    if (!playersById.has(row.player_id)) {
      playersById.set(row.player_id, {
        player: mapPlayer(row),
        stats: null,
        periods: [],
        halves: []
      });
    }

    playersById.get(row.player_id).halves.push({
      half: row.half,
      stats: mapPlayerStat(row)
    });
  }

  return {
    team,
    stats: mapTeamStat(teamStats),
    periods: teamPeriodRows
      .filter((row) => row.team_id === team.id)
      .map((row) => ({
        period: row.period,
        stats: mapTeamStat(row)
      })),
    halves: teamHalfRows
      .filter((row) => row.team_id === team.id)
      .map((row) => ({
        half: row.half,
        stats: mapTeamStat(row)
      })),
    players: Array.from(playersById.values()).map((player) => ({
      ...player,
      periods: player.periods.sort((a, b) => a.period - b.period),
      halves: player.halves.sort((a, b) => a.half - b.half)
    }))
  };
}

function valueOrCurrent(payload, field, currentValue) {
  return Object.prototype.hasOwnProperty.call(payload, field) ? payload[field] : currentValue;
}

async function listGames(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.leagueId) {
    values.push(filters.leagueId);
    conditions.push(`g.league_id = $${values.length}`);
  }

  if (filters.leagueCode) {
    values.push(filters.leagueCode);
    conditions.push(`l.code = $${values.length}`);
  }

  if (filters.seasonId) {
    values.push(filters.seasonId);
    conditions.push(`g.season_id = $${values.length}`);
  }

  if (filters.season) {
    values.push(filters.season);
    conditions.push(`s.name = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`g.status = $${values.length}`);
  }

  if (filters.stage) {
    values.push(filters.stage);
    conditions.push(`g.stage = $${values.length}`);
  }

  if (filters.teamId) {
    values.push(filters.teamId);
    conditions.push(`(g.home_team_id = $${values.length} OR g.away_team_id = $${values.length})`);
  }

  if (filters.from) {
    values.push(filters.from);
    conditions.push(`g.game_date >= $${values.length}`);
  }

  if (filters.to) {
    values.push(filters.to);
    conditions.push(`g.game_date <= $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;

  values.push(limit, offset);

  const rows = await query(
    `
      SELECT
        g.id,
        g.league_id,
        g.season_id,
        g.external_game_id,
        g.game_code,
        g.game_date::text AS game_date,
        g.game_time,
        g.venue,
        g.attendance,
        g.capacity,
        g.stage,
        g.home_score,
        g.away_score,
        g.status,
        l.code AS league_code,
        l.name AS league_name,
        s.name AS season_name,
        home_team.id AS home_team_id,
        home_team.name AS home_team_name,
        home_team.short_name AS home_team_short_name,
        home_team.logo_url AS home_team_logo_url,
        away_team.id AS away_team_id,
        away_team.name AS away_team_name,
        away_team.short_name AS away_team_short_name,
        away_team.logo_url AS away_team_logo_url
      FROM games g
      JOIN leagues l ON l.id = g.league_id
      JOIN seasons s ON s.id = g.season_id
      JOIN teams home_team ON home_team.id = g.home_team_id
      JOIN teams away_team ON away_team.id = g.away_team_id
      ${whereClause}
      ORDER BY g.game_date ASC, g.game_time ASC NULLS LAST
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
    `,
    values
  );

  return rows.map(mapGame);
}

async function getGameById(id) {
  const row = await queryOne(
    `
      SELECT
        g.id,
        g.league_id,
        g.season_id,
        g.external_game_id,
        g.game_code,
        g.game_date::text AS game_date,
        g.game_time,
        g.venue,
        g.attendance,
        g.capacity,
        g.stage,
        g.home_score,
        g.away_score,
        g.status,
        l.code AS league_code,
        l.name AS league_name,
        s.name AS season_name,
        home_team.id AS home_team_id,
        home_team.name AS home_team_name,
        home_team.short_name AS home_team_short_name,
        home_team.logo_url AS home_team_logo_url,
        away_team.id AS away_team_id,
        away_team.name AS away_team_name,
        away_team.short_name AS away_team_short_name,
        away_team.logo_url AS away_team_logo_url
      FROM games g
      JOIN leagues l ON l.id = g.league_id
      JOIN seasons s ON s.id = g.season_id
      JOIN teams home_team ON home_team.id = g.home_team_id
      JOIN teams away_team ON away_team.id = g.away_team_id
      WHERE g.id = $1
    `,
    [id]
  );

  if (!row) {
    throw new AppError("Game not found", 404);
  }

  return mapGame(row);
}

async function getGameBoxscoreById(id) {
  const game = await getGameById(id);
  const [
    refereeRows,
    teamStatsRows,
    teamPeriodRows,
    teamHalfRows,
    playerStatRows,
    playerPeriodRows,
    playerHalfRows
  ] =
    await Promise.all([
      query(
        `
          SELECT role, name, sort_order
          FROM game_referees
          WHERE game_id = $1
          ORDER BY sort_order ASC
        `,
        [id]
      ),
      query(
        `
          SELECT *
          FROM game_team_stats
          WHERE game_id = $1
          ORDER BY team_id
        `,
        [id]
      ),
      query(
        `
          SELECT *
          FROM game_team_period_stats
          WHERE game_id = $1
          ORDER BY team_id, period
        `,
        [id]
      ),
      query(
        `
          SELECT *
          FROM game_team_half_stats
          WHERE game_id = $1
          ORDER BY team_id, half
        `,
        [id]
      ),
      query(
        `
          SELECT
            gps.*,
            p.name AS player_name,
            p.player_type,
            p.position,
            p.official_player_id,
            p.person_id,
            p.random_id,
            p.english_name,
            p.jersey_number
          FROM game_player_stats gps
          JOIN players p ON p.id = gps.player_id
          WHERE gps.game_id = $1
          ORDER BY
            gps.team_id,
            gps.starter DESC,
            gps.minutes DESC NULLS LAST,
            gps.points DESC NULLS LAST,
            p.name ASC
        `,
        [id]
      ),
      query(
        `
          SELECT
            gpps.*,
            p.name AS player_name,
            p.player_type,
            p.position,
            p.official_player_id,
            p.person_id,
            p.random_id,
            p.english_name,
            p.jersey_number
          FROM game_player_period_stats gpps
          JOIN players p ON p.id = gpps.player_id
          WHERE gpps.game_id = $1
          ORDER BY gpps.team_id, p.name ASC, gpps.period ASC
        `,
        [id]
      ),
      query(
        `
          SELECT
            gphs.*,
            p.name AS player_name,
            p.player_type,
            p.position,
            p.official_player_id,
            p.person_id,
            p.random_id,
            p.english_name,
            p.jersey_number
          FROM game_player_half_stats gphs
          JOIN players p ON p.id = gphs.player_id
          WHERE gphs.game_id = $1
          ORDER BY gphs.team_id, p.name ASC, gphs.half ASC
        `,
        [id]
      )
    ]);

  return {
    game: {
      ...game,
      referees: refereeRows.map(mapReferee)
    },
    teams: {
      away: buildTeamBoxscore(
        game.awayTeam,
        teamStatsRows,
        teamPeriodRows,
        teamHalfRows,
        playerStatRows,
        playerPeriodRows,
        playerHalfRows
      ),
      home: buildTeamBoxscore(
        game.homeTeam,
        teamStatsRows,
        teamPeriodRows,
        teamHalfRows,
        playerStatRows,
        playerPeriodRows,
        playerHalfRows
      )
    }
  };
}

async function createGame(payload) {
  if (payload.homeTeamId === payload.awayTeamId) {
    throw new AppError("homeTeamId and awayTeamId must be different", 400);
  }

  const row = await queryOne(
    `
      INSERT INTO games (
        league_id,
        season_id,
        external_game_id,
        game_code,
        game_date,
        game_time,
        venue,
        attendance,
        capacity,
        home_team_id,
        away_team_id,
        stage,
        status,
        home_score,
        away_score
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id
    `,
    [
      payload.leagueId,
      payload.seasonId,
      payload.externalGameId || null,
      payload.gameCode || null,
      payload.gameDate,
      payload.gameTime || null,
      payload.venue || null,
      payload.attendance ?? null,
      payload.capacity ?? null,
      payload.homeTeamId,
      payload.awayTeamId,
      payload.stage || "regular_season",
      payload.status || "scheduled",
      payload.homeScore ?? null,
      payload.awayScore ?? null
    ]
  );

  return getGameById(row.id);
}

async function updateGame(id, payload) {
  const current = await getGameById(id);

  const next = {
    leagueId: valueOrCurrent(payload, "leagueId", current.leagueId),
    seasonId: valueOrCurrent(payload, "seasonId", current.seasonId),
    externalGameId: valueOrCurrent(payload, "externalGameId", current.externalGameId),
    gameCode: valueOrCurrent(payload, "gameCode", current.gameCode),
    gameDate: valueOrCurrent(payload, "gameDate", current.gameDate),
    gameTime: valueOrCurrent(payload, "gameTime", current.gameTime),
    venue: valueOrCurrent(payload, "venue", current.venue),
    attendance: valueOrCurrent(payload, "attendance", current.attendance),
    capacity: valueOrCurrent(payload, "capacity", current.capacity),
    homeTeamId: valueOrCurrent(payload, "homeTeamId", current.homeTeam.id),
    awayTeamId: valueOrCurrent(payload, "awayTeamId", current.awayTeam.id),
    stage: valueOrCurrent(payload, "stage", current.stage),
    homeScore: valueOrCurrent(payload, "homeScore", current.homeScore),
    awayScore: valueOrCurrent(payload, "awayScore", current.awayScore),
    status: valueOrCurrent(payload, "status", current.status)
  };

  if (next.homeTeamId === next.awayTeamId) {
    throw new AppError("homeTeamId and awayTeamId must be different", 400);
  }

  const row = await queryOne(
    `
      UPDATE games
      SET league_id = $2,
          season_id = $3,
          external_game_id = $4,
          game_code = $5,
          game_date = $6,
          game_time = $7,
          venue = $8,
          attendance = $9,
          capacity = $10,
          home_team_id = $11,
          away_team_id = $12,
          stage = $13,
          status = $14,
          home_score = $15,
          away_score = $16
      WHERE id = $1
      RETURNING id
    `,
    [
      id,
      next.leagueId,
      next.seasonId,
      next.externalGameId,
      next.gameCode,
      next.gameDate,
      next.gameTime,
      next.venue,
      next.attendance,
      next.capacity,
      next.homeTeamId,
      next.awayTeamId,
      next.stage,
      next.status,
      next.homeScore,
      next.awayScore
    ]
  );

  return getGameById(row.id);
}

async function deleteGame(id) {
  const row = await queryOne("DELETE FROM games WHERE id = $1 RETURNING id", [id]);

  if (!row) {
    throw new AppError("Game not found", 404);
  }
}

module.exports = {
  listGames,
  getGameById,
  getGameBoxscoreById,
  createGame,
  updateGame,
  deleteGame
};
