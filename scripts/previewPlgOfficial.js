const fs = require("fs");
const path = require("path");

const { chromium } = require("playwright");

const BASE_URL = "https://pleagueofficial.com";
const OUTPUT_PATH = path.join(__dirname, "..", "previews", "plg-preview.json");
const MAX_GAME_DETAILS = Number(process.env.PLG_PREVIEW_MAX_GAME_DETAILS || 3);
const MAX_PLAYER_DETAILS = Number(process.env.PLG_PREVIEW_MAX_PLAYER_DETAILS || 5);

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

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function parseIntOrNull(value) {
  const normalized = collapseDuplicatedValue(value);

  if (!/^-?\d+$/.test(normalized)) {
    return null;
  }

  return Number(normalized);
}

function parseScheduleCard(card) {
  const lines = toLines(card.text);
  const awayIndex = lines.indexOf("客隊");
  const homeIndex = lines.indexOf("主隊");
  const gameCodeIndex = lines.findIndex((line) => /^G\d+$/i.test(line));
  const date = lines.find((line) => /^\d{2}\/\d{2}$/.test(line)) || null;
  const gameTime = lines.find((line) => /^\d{2}:\d{2}$/.test(line)) || null;
  const officialGameId = card.href.match(/\/game\/(\d+)/)?.[1] || null;

  return {
    sourceUrl: card.href,
    officialGameId,
    gameCode: gameCodeIndex >= 0 ? lines[gameCodeIndex] : null,
    date,
    weekday: date ? lines[lines.indexOf(date) + 1] || null : null,
    gameTime,
    venue: gameCodeIndex >= 0 ? lines[gameCodeIndex + 1] || null : null,
    awayTeam: awayIndex >= 0
      ? {
          name: collapseDuplicatedValue(lines[awayIndex + 1]) || null,
          englishName: lines[awayIndex + 2] || null,
          score: parseIntOrNull(lines[awayIndex + 3])
        }
      : null,
    homeTeam: homeIndex >= 0
      ? {
          name: collapseDuplicatedValue(lines[homeIndex + 1]) || null,
          englishName: lines[homeIndex + 2] || null,
          score: parseIntOrNull(lines[homeIndex - 1])
        }
      : null,
    rawLines: lines
  };
}

async function goto(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);
}

async function scrapeSchedule(page) {
  const url = `${BASE_URL}/schedule-regular-season`;
  await goto(page, url);

  const title = await page.title();
  const bodyText = await page.locator("body").innerText();
  const seasonName = bodyText.match(/20\d{2}-\d{2}/)?.[0] || null;

  const cards = await page.locator('a[href*="/game/"]').evaluateAll((links) => {
    return links.map((link) => {
      let current = link;
      let selected = link;

      for (let depth = 0; depth < 8 && current; depth += 1) {
        const text = current.innerText || "";
        const gameLinkCount = current.querySelectorAll('a[href*="/game/"]').length;

        if (text.includes("客隊") && text.includes("主隊") && gameLinkCount <= 1) {
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

  const games = uniqueBy(cards.map(parseScheduleCard), (game) => game.sourceUrl);
  const teams = uniqueBy(
    games.flatMap((game) => [game.homeTeam, game.awayTeam]).filter(Boolean),
    (team) => `${team.name}|${team.englishName}`
  ).map((team) => ({
    name: team.name,
    englishName: team.englishName
  }));

  return {
    sourceUrl: url,
    title,
    seasonName,
    teams,
    games
  };
}

async function scrapePlayerLinks(page) {
  const url = `${BASE_URL}/all-players`;
  await goto(page, url);

  const title = await page.title();
  const links = await page.locator('a[href*="/player/"]').evaluateAll((anchors) => {
    return anchors.map((anchor) => ({
      href: anchor.href,
      text: anchor.innerText || ""
    }));
  });

  const players = uniqueBy(
    links
      .map((link) => ({
        sourceUrl: link.href,
        officialPlayerId: link.href.match(/\/player\/([^/?#]+)/)?.[1] || null,
        name: link.text.replace(/\s+/g, " ").trim() || null
      }))
      .filter((player) => player.officialPlayerId),
    (player) => player.sourceUrl
  );

  return {
    sourceUrl: url,
    title,
    players
  };
}

async function scrapePlayerDetails(page, playerLinks) {
  const details = [];

  for (const player of playerLinks.slice(0, MAX_PLAYER_DETAILS)) {
    await goto(page, player.sourceUrl);

    const title = await page.title();
    const lines = toLines(await page.locator("body").innerText());

    details.push({
      sourceUrl: player.sourceUrl,
      officialPlayerId: player.officialPlayerId,
      linkName: player.name,
      title,
      rawLines: lines.slice(0, 80)
    });
  }

  return details;
}

async function scrapeGameDetails(page, gameLinks) {
  const details = [];

  for (const game of gameLinks.slice(0, MAX_GAME_DETAILS)) {
    await goto(page, game.sourceUrl);

    const title = await page.title();
    const lines = toLines(await page.locator("body").innerText());
    const tables = await page.locator("table").evaluateAll((tablesOnPage) => {
      return tablesOnPage.map((table) => {
        return Array.from(table.querySelectorAll("tr")).map((row) => {
          return Array.from(row.querySelectorAll("th, td")).map((cell) =>
            cell.innerText.replace(/\s+/g, " ").trim()
          );
        });
      });
    });

    details.push({
      sourceUrl: game.sourceUrl,
      officialGameId: game.officialGameId,
      gameCode: game.gameCode,
      title,
      tableCount: tables.length,
      tables: tables.slice(0, 4),
      rawLines: lines.slice(0, 120)
    });
  }

  return details;
}

async function scrapeStatTables(page) {
  const pages = [
    { key: "teamStats", url: `${BASE_URL}/stat-team` },
    { key: "playerStats", url: `${BASE_URL}/stat-player` }
  ];
  const result = {};

  for (const statPage of pages) {
    await goto(page, statPage.url);

    const title = await page.title();
    const tables = await page.locator("table").evaluateAll((tablesOnPage) => {
      return tablesOnPage.map((table) => {
        return Array.from(table.querySelectorAll("tr")).slice(0, 8).map((row) => {
          return Array.from(row.querySelectorAll("th, td")).map((cell) =>
            cell.innerText.replace(/\s+/g, " ").trim()
          );
        });
      });
    });

    result[statPage.key] = {
      sourceUrl: statPage.url,
      title,
      tableCount: tables.length,
      tables: tables.slice(0, 2),
      rawLines: toLines(await page.locator("body").innerText()).slice(0, 100)
    };
  }

  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    locale: "zh-TW",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });

  try {
    const schedule = await scrapeSchedule(page);
    const playerList = await scrapePlayerLinks(page);
    const playerDetails = await scrapePlayerDetails(page, playerList.players);
    const gameDetails = await scrapeGameDetails(page, schedule.games);
    const statTables = await scrapeStatTables(page);

    const preview = {
      scrapedAt: new Date().toISOString(),
      source: "P. LEAGUE+ official website",
      writesToDatabase: false,
      league: {
        code: "PLG",
        name: "P. LEAGUE+"
      },
      seasons: schedule.seasonName ? [{ name: schedule.seasonName }] : [],
      schedule,
      playerList,
      playerDetails,
      gameDetails,
      statTables
    };

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(preview, null, 2)}\n`, "utf8");

    console.log(`Preview written: ${OUTPUT_PATH}`);
    console.log(`Teams from schedule: ${schedule.teams.length}`);
    console.log(`Games from schedule: ${schedule.games.length}`);
    console.log(`Player links: ${playerList.players.length}`);
    console.log(`Game detail pages sampled: ${gameDetails.length}`);
    console.log(JSON.stringify({
      sampleTeam: schedule.teams[0] || null,
      sampleGame: schedule.games[0] || null,
      samplePlayer: playerList.players[0] || null
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
