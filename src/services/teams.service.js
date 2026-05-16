const AppError = require("../errors/AppError");
const { query, queryOne } = require("../db/query");

function mapTeam(row) {
  return {
    id: row.id,
    leagueId: row.league_id,
    name: row.name,
    shortName: row.short_name,
    logoUrl: row.logo_url,
    league: {
      id: row.league_id,
      code: row.league_code,
      name: row.league_name
    }
  };
}

function valueOrCurrent(payload, field, currentValue) {
  return Object.prototype.hasOwnProperty.call(payload, field) ? payload[field] : currentValue;
}

async function listTeams(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.leagueId) {
    values.push(filters.leagueId);
    conditions.push(`t.league_id = $${values.length}`);
  }

  if (filters.leagueCode) {
    values.push(filters.leagueCode);
    conditions.push(`l.code = $${values.length}`);
  }

  if (filters.q) {
    values.push(`%${filters.q}%`);
    conditions.push(`t.name ILIKE $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  values.push(limit, offset);

  const rows = await query(
    `
      SELECT
        t.id,
        t.league_id,
        t.name,
        t.short_name,
        t.logo_url,
        l.code AS league_code,
        l.name AS league_name
      FROM teams t
      JOIN leagues l ON l.id = t.league_id
      ${whereClause}
      ORDER BY l.code ASC, t.name ASC
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
    `,
    values
  );

  return rows.map(mapTeam);
}

async function getTeamById(id) {
  const row = await queryOne(
    `
      SELECT
        t.id,
        t.league_id,
        t.name,
        t.short_name,
        t.logo_url,
        l.code AS league_code,
        l.name AS league_name
      FROM teams t
      JOIN leagues l ON l.id = t.league_id
      WHERE t.id = $1
    `,
    [id]
  );

  if (!row) {
    throw new AppError("Team not found", 404);
  }

  return mapTeam(row);
}

async function createTeam(payload) {
  const row = await queryOne(
    `
      INSERT INTO teams (league_id, name, short_name, logo_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
    [payload.leagueId, payload.name, payload.shortName || null, payload.logoUrl || null]
  );

  return getTeamById(row.id);
}

async function updateTeam(id, payload) {
  const current = await getTeamById(id);

  const next = {
    leagueId: valueOrCurrent(payload, "leagueId", current.leagueId),
    name: valueOrCurrent(payload, "name", current.name),
    shortName: valueOrCurrent(payload, "shortName", current.shortName),
    logoUrl: valueOrCurrent(payload, "logoUrl", current.logoUrl)
  };

  const row = await queryOne(
    `
      UPDATE teams
      SET league_id = $2,
          name = $3,
          short_name = $4,
          logo_url = $5
      WHERE id = $1
      RETURNING id
    `,
    [id, next.leagueId, next.name, next.shortName, next.logoUrl]
  );

  return getTeamById(row.id);
}

async function deleteTeam(id) {
  const row = await queryOne("DELETE FROM teams WHERE id = $1 RETURNING id", [id]);

  if (!row) {
    throw new AppError("Team not found", 404);
  }
}

module.exports = {
  listTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam
};
