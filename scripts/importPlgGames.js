const fs = require("fs");
const path = require("path");

const { chromium } = require("playwright");

const pool = require("../src/db/pool");

const BASE_URL = "https://pleagueofficial.com";
const SEASON_NAME = process.env.PLG_SEASON || "2025-26";
const OUTPUT_PATH = path.join(__dirname, "..", "previews", "plg-games-import-summary.json");

const AWAY_LABEL = "\u5ba2\u968a";
const HOME_LABEL = "\u4e3b\u968a";
const TRACK_LABEL = "\u8ffd\u8e64\u8cfd\u4e8b";
const REFEREE_ROLES = [
  { role: "chief", label: "\u4e3b\u88c1\u5224", sortOrder: 1 },
  { role: "first_inspector", label: "\u7b2c\u4e00\u6aa2\u67e5\u54e1", sortOrder: 2 },
  { role: "second_inspector", label: "\u7b2c\u4e8c\u6aa2\u67e5\u54e1", sortOrder: 3 }
];
const INVALID_REFEREE_NAMES = new Set(["\u50b7\u5175\u540d\u55ae", "SUMMARY"]);

const schedulePages = [
  {
    stage: "regular_season",
    url: `${BASE_URL}/schedule-regular-season/${SEASON_NAME}`
  },
  {
    stage: "playoffs",
    url: `${BASE_URL}/schedule-playoffs/${SEASON_NAME}`
  }
];

function clean(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function collapseDuplicatedValue(value) {
  const text = clean(value);

  if (text.length % 2 !== 0) {
    return text;
  }

  const midpoint = text.length / 2;
  const first = text.slice(0, midpoint);
  const second = text.slice(midpoint);

  return first === second ? first : text;
}

function toLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean);
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = keyFn(item);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function parseInteger(value) {
  const normalized = collapseDuplicatedValue(value);

  if (!/^-?\d+$/.test(normalized)) {
    return null;
  }

  return Number(normalized);
}

function parseAttendanceCapacity(value) {
  const match = clean(value).match(/^([\d,]+)\s*\/\s*([\d,]+)$/);

  if (!match) {
    return {
      attendance: null,
      capacity: null
    };
  }

  const attendance = Number(match[1].replace(/,/g, ""));
  const capacity = Number(match[2].replace(/,/g, ""));

  if (attendance === 0 && capacity === 0) {
    return {
      attendance: null,
      capacity: null
    };
  }

  return {
    attendance,
    capacity
  };
}

function parseSeasonYears(seasonName) {
  const match = seasonName.match(/^(\d{4})-(\d{2})$/);

  if (!match) {
    throw new Error(`Unsupported season format: ${seasonName}`);
  }

  const startYear = Number(match[1]);
  const endYear = Number(`${String(startYear).slice(0, 2)}${match[2]}`);

  return { startYear, endYear };
}

function toGameDate(mmdd, seasonName) {
  const match = mmdd.match(/^(\d{2})\/(\d{2})$/);

  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const { startYear, endYear } = parseSeasonYears(seasonName);
  const year = month >= 7 ? startYear : endYear;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeGameTime(value) {
  const text = clean(value);

  if (/^\d{2}:\d{2}$/.test(text)) {
    return `${text}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(text)) {
    return text;
  }

  return null;
}

function parseTeam(lines, labelIndex, scoreIndex) {
  if (labelIndex < 0) {
    return null;
  }

  return {
    name: collapseDuplicatedValue(lines[labelIndex + 1]) || null,
    englishName: clean(lines[labelIndex + 2]) || null,
    score: parseInteger(lines[scoreIndex])
  };
}

function parseScheduleCard(card, stage) {
  const lines = toLines(card.text);
  const awayIndex = lines.indexOf(AWAY_LABEL);
  const homeIndex = lines.indexOf(HOME_LABEL);
  const trackingIndex = lines.indexOf(TRACK_LABEL);
  const date = lines.find((line) => /^\d{2}\/\d{2}$/.test(line)) || null;
  const gameTime = lines.find((line) => /^\d{2}:\d{2}$/.test(line)) || null;
  const awayScoreIndex = awayIndex >= 0 ? awayIndex + 3 : -1;
  const homeScoreIndex = homeIndex >= 1 ? homeIndex - 1 : -1;
  const officialGameId = card.href.match(/\/game\/([^/?#]+)/)?.[1] || null;
  const venue = trackingIndex > 0 ? lines[trackingIndex - 1] : null;
  const attendanceCapacity = parseAttendanceCapacity(
    trackingIndex >= 0 ? lines[trackingIndex + 1] : null
  );
  const gameLabelParts =
    awayScoreIndex >= 0 && trackingIndex > awayScoreIndex
      ? lines.slice(awayScoreIndex + 1, Math.max(awayScoreIndex + 1, trackingIndex - 1))
      : [];
  const gameCode = clean(gameLabelParts.join(" ")) || null;
  const awayTeam = parseTeam(lines, awayIndex, awayScoreIndex);
  const homeTeam = parseTeam(lines, homeIndex, homeScoreIndex);
  const isFinal = Boolean(
    awayTeam &&
      homeTeam &&
      awayTeam.score !== null &&
      homeTeam.score !== null &&
      (awayTeam.score > 0 || homeTeam.score > 0)
  );

  return {
    stage,
    sourceUrl: card.href,
    externalGameId: officialGameId,
    gameCode,
    gameLabel: gameCode,
    gameDate: date ? toGameDate(date, SEASON_NAME) : null,
    gameTime: normalizeGameTime(gameTime),
    venue,
    attendance: attendanceCapacity.attendance,
    capacity: attendanceCapacity.capacity,
    status: isFinal ? "final" : "scheduled",
    awayTeam,
    homeTeam,
    awayScore: isFinal ? awayTeam.score : null,
    homeScore: isFinal ? homeTeam.score : null,
    rawLines: lines
  };
}

function parseReferees(lines) {
  const refereeLine =
    lines.find((line) => REFEREE_ROLES.every((refereeRole) => line.includes(refereeRole.label))) ||
    null;

  return REFEREE_ROLES.map(({ role, label, sortOrder }) => {
    const labelIndex = lines.indexOf(label);
    const lineName = labelIndex >= 0 ? clean(lines[labelIndex + 1]) : null;
    const inlineName = refereeLine?.match(new RegExp(`${label}\\s+([^\\s]+)`))?.[1] || null;
    const name = lineName || inlineName;

    if (
      !name ||
      INVALID_REFEREE_NAMES.has(name) ||
      REFEREE_ROLES.some((refereeRole) => refereeRole.label === name)
    ) {
      return null;
    }

    return {
      role,
      title: label,
      name,
      sortOrder
    };
  }).filter(Boolean);
}

async function goto(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);
}

async function scrapeGameReferees(page, game) {
  if (!game.sourceUrl) {
    return [];
  }

  await goto(page, game.sourceUrl);

  return parseReferees(toLines(await page.locator("body").innerText()));
}

async function scrapeSchedulePage(page, schedulePage) {
  await goto(page, schedulePage.url);

  const title = await page.title();
  const cards = await page.locator("a").evaluateAll((links) => {
    return links
      .filter((link) => link.href.includes("/game/"))
      .map((link) => {
        let current = link;
        let selected = link;

        for (let depth = 0; depth < 8 && current; depth += 1) {
          const text = current.innerText || "";
          const gameLinkCount = current.querySelectorAll('a[href*="/game/"]').length;

          if (text.includes("\u5ba2\u968a") && text.includes("\u4e3b\u968a") && gameLinkCount <= 1) {
            selected = current;
            break;
          }

          current = current.parentElement;
        }

        return {
          href: link.href,
          text: selected.innerText || link.innerText || ""
        };
      });
  });

  const games = uniqueBy(
    cards.map((card) => parseScheduleCard(card, schedulePage.stage)),
    (game) => game.externalGameId
  );

  for (const game of games) {
    game.referees = await scrapeGameReferees(page, game);
  }

  return {
    stage: schedulePage.stage,
    sourceUrl: schedulePage.url,
    title,
    games
  };
}

async function ensureLeague(client) {
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

async function ensureSeason(client, leagueId) {
  const { rows } = await client.query(
    `
      INSERT INTO seasons (league_id, name)
      VALUES ($1, $2)
      ON CONFLICT (league_id, name)
      DO NOTHING
      RETURNING id
    `,
    [leagueId, SEASON_NAME]
  );

  if (rows[0]) {
    return rows[0].id;
  }

  const existing = await client.query(
    "SELECT id FROM seasons WHERE league_id = $1 AND name = $2",
    [leagueId, SEASON_NAME]
  );

  return existing.rows[0].id;
}

async function loadTeams(client, leagueId) {
  const { rows } = await client.query(
    `
      SELECT id, name, short_name
      FROM teams
      WHERE league_id = $1
    `,
    [leagueId]
  );
  const teamsByName = new Map();

  for (const row of rows) {
    teamsByName.set(row.name, row);

    if (row.short_name) {
      teamsByName.set(row.short_name, row);
    }
  }

  return teamsByName;
}

function resolveTeamId(teamsByName, team, game) {
  if (!team?.name) {
    throw new Error(`Missing team name for game ${game.externalGameId}`);
  }

  const row = teamsByName.get(team.name);

  if (!row) {
    throw new Error(`Team not found for game ${game.externalGameId}: ${team.name}`);
  }

  return row.id;
}

function validateGame(game) {
  const missing = [];

  for (const field of ["externalGameId", "gameDate", "gameTime", "awayTeam", "homeTeam"]) {
    if (!game[field]) {
      missing.push(field);
    }
  }

  if (missing.length) {
    throw new Error(`Game ${game.sourceUrl} missing fields: ${missing.join(", ")}`);
  }
}

async function upsertGame(client, leagueId, seasonId, teamsByName, game) {
  validateGame(game);

  const awayTeamId = resolveTeamId(teamsByName, game.awayTeam, game);
  const homeTeamId = resolveTeamId(teamsByName, game.homeTeam, game);
  const { rows } = await client.query(
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
      ON CONFLICT (league_id, external_game_id)
      DO UPDATE
      SET season_id = EXCLUDED.season_id,
          game_code = EXCLUDED.game_code,
          game_date = EXCLUDED.game_date,
          game_time = EXCLUDED.game_time,
          venue = EXCLUDED.venue,
          attendance = EXCLUDED.attendance,
          capacity = EXCLUDED.capacity,
          home_team_id = EXCLUDED.home_team_id,
          away_team_id = EXCLUDED.away_team_id,
          stage = EXCLUDED.stage,
          status = EXCLUDED.status,
          home_score = EXCLUDED.home_score,
          away_score = EXCLUDED.away_score
      RETURNING
        id,
        external_game_id,
        game_code,
        game_date,
        game_time,
        venue,
        attendance,
        capacity,
        stage,
        status,
        home_score,
        away_score
    `,
    [
      leagueId,
      seasonId,
      game.externalGameId,
      game.gameCode,
      game.gameDate,
      game.gameTime,
      game.venue || null,
      game.attendance,
      game.capacity,
      homeTeamId,
      awayTeamId,
      game.stage,
      game.status,
      game.homeScore,
      game.awayScore
    ]
  );

  await replaceGameReferees(client, rows[0].id, game.referees || []);

  return {
    ...rows[0],
    referees: game.referees || []
  };
}

async function replaceGameReferees(client, gameId, referees) {
  await client.query("DELETE FROM game_referees WHERE game_id = $1", [gameId]);

  for (const referee of referees.slice(0, 3)) {
    await client.query(
      `
        INSERT INTO game_referees (game_id, role, name, sort_order)
        VALUES ($1, $2, $3, $4)
      `,
      [gameId, referee.role, referee.name, referee.sortOrder]
    );
  }
}

async function scrapeGames() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    locale: "zh-TW",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });

  try {
    const schedules = [];

    for (const schedulePage of schedulePages) {
      schedules.push(await scrapeSchedulePage(page, schedulePage));
    }

    return schedules;
  } finally {
    await browser.close();
  }
}

async function run() {
  const schedules = await scrapeGames();
  const games = schedules.flatMap((schedule) => schedule.games);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const leagueId = await ensureLeague(client);
    const seasonId = await ensureSeason(client, leagueId);
    const teamsByName = await loadTeams(client, leagueId);
    const importedGames = [];

    for (const game of games) {
      importedGames.push(await upsertGame(client, leagueId, seasonId, teamsByName, game));
    }

    await client.query("COMMIT");

    const summary = {
      scrapedAt: new Date().toISOString(),
      season: SEASON_NAME,
      writesToDatabase: true,
      sourcePages: schedules.map((schedule) => ({
        stage: schedule.stage,
        sourceUrl: schedule.sourceUrl,
        title: schedule.title,
        scrapedGames: schedule.games.length
      })),
      imported: {
        total: importedGames.length,
        byStage: importedGames.reduce((acc, game) => {
          acc[game.stage] = (acc[game.stage] || 0) + 1;
          return acc;
        }, {})
      },
      sampleGames: games.slice(0, 5),
      importedRows: importedGames
    };

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

    console.log(`Imported games: ${summary.imported.total}`);
    console.log(JSON.stringify(summary.imported.byStage, null, 2));
    console.log(`Summary written: ${OUTPUT_PATH}`);
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
