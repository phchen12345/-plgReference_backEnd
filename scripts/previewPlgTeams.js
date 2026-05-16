const fs = require("fs");
const path = require("path");

const { chromium } = require("playwright");

const BASE_URL = "https://pleagueofficial.com";
const OUTPUT_PATH = path.join(__dirname, "..", "previews", "plg-teams-preview.json");

function clean(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
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

function officialTeamIdFromUrl(url) {
  return url.match(/\/team\/([^/?#]+)/)?.[1] || null;
}

function normalizeFullName(text) {
  return clean(text).replace(/簡介.*$/, "");
}

function absoluteUrl(url) {
  if (!url) {
    return null;
  }

  return new URL(url, BASE_URL).href.replace("http://pleagueofficial.com", "https://pleagueofficial.com");
}

function pickLogoUrl(images, officialTeamId) {
  const exactTeamLogo = images.filter((image) => {
    const src = image.src.toLowerCase();
    return src.includes(`/upload/p_team/logo_${officialTeamId}_`);
  });
  const candidates = exactTeamLogo.length
    ? exactTeamLogo
    : images.filter((image) => {
        const src = image.src.toLowerCase();
        return src.includes("logo") && !src.includes("pleague_logo");
      });

  const ranked = candidates.length ? candidates : images;
  const preferred = ranked
    .filter((image) => image.width >= 80 && image.height >= 80)
    .sort((a, b) => {
      const aSquareScore = Math.abs(a.width - a.height);
      const bSquareScore = Math.abs(b.width - b.height);
      return b.width * b.height - a.width * a.height || aSquareScore - bSquareScore;
    });

  return preferred[0]?.src || ranked[0]?.src || null;
}

async function goto(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);
}

async function getCurrentTeamLinks(page) {
  await goto(page, BASE_URL);

  const navLinks = await page.locator('a.dropdown-item[href*="/team/"]').evaluateAll((anchors) => {
    return anchors.map((anchor) => ({
      href: anchor.href,
      text: anchor.innerText || ""
    }));
  });

  return uniqueBy(
    navLinks
      .filter((link) => link.text.includes("簡介"))
      .map((link) => ({
        officialTeamId: link.href.match(/\/team\/([^/?#]+)/)?.[1] || null,
        sourceUrl: link.href,
        nameFromNav: link.text.replace(/簡介.*$/, "").trim()
      })),
    (link) => link.officialTeamId
  );
}

async function getScheduleShortNames(page) {
  await goto(page, BASE_URL);

  const links = await page.locator('a[href*="/team/"]').evaluateAll((anchors) => {
    return anchors.map((anchor) => ({
      href: anchor.href,
      text: anchor.innerText || "",
      className: anchor.className || ""
    }));
  });

  const shortNameByTeamId = {};

  for (const link of links) {
    const officialTeamId = officialTeamIdFromUrl(link.href);
    const text = clean(link.text);
    const className = String(link.className || "");

    if (!officialTeamId || !text || !className.includes("text-primary")) {
      continue;
    }

    shortNameByTeamId[officialTeamId] = text;
  }

  return shortNameByTeamId;
}

async function scrapeTeamPage(page, teamLink, shortNameByTeamId) {
  await goto(page, teamLink.sourceUrl);

  const pageData = await page.evaluate(() => {
    const imageData = Array.from(document.images).map((image) => ({
      src: image.currentSrc || image.src,
      alt: image.alt || "",
      width: image.naturalWidth || image.width || 0,
      height: image.naturalHeight || image.height || 0,
      className: image.className || ""
    }));

    const metaImage =
      document.querySelector('meta[property="og:image"]')?.content ||
      document.querySelector('meta[name="twitter:image"]')?.content ||
      null;

    return {
      title: document.title,
      metaImage,
      images: imageData,
      lines: document.body.innerText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 80)
    };
  });

  const officialTeamId = teamLink.officialTeamId;
  const nameFromTitle = clean(pageData.title.split(" - ")[0]);
  const name = normalizeFullName(teamLink.nameFromNav || nameFromTitle);
  const logoCandidates = uniqueBy(
    [
      pageData.metaImage ? { src: absoluteUrl(pageData.metaImage), alt: "meta image", width: 0, height: 0 } : null,
      ...pageData.images.map((image) => ({
        ...image,
        src: absoluteUrl(image.src)
      }))
    ].filter(Boolean),
    (image) => image.src
  );

  return {
    table: "teams",
    sourceUrl: teamLink.sourceUrl,
    officialTeamId,
    proposedRow: {
      id: null,
      league_id: null,
      league_code: "PLG",
      name,
      short_name: shortNameByTeamId[officialTeamId] || null,
      logo_url: pickLogoUrl(logoCandidates, officialTeamId)
    },
    sourceEvidence: {
      title: pageData.title,
      nameFromNav: teamLink.nameFromNav,
      rawLines: pageData.lines.map(clean),
      logoCandidates: logoCandidates.slice(0, 10)
    }
  };
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
    const teamLinks = await getCurrentTeamLinks(page);
    const shortNameByTeamId = await getScheduleShortNames(page);
    const teams = [];

    for (const teamLink of teamLinks) {
      teams.push(await scrapeTeamPage(page, teamLink, shortNameByTeamId));
    }

    const preview = {
      scrapedAt: new Date().toISOString(),
      source: "P. LEAGUE+ official website",
      writesToDatabase: false,
      league: {
        code: "PLG",
        name: "P. LEAGUE+"
      },
      table: "teams",
      schemaColumns: ["id", "league_id", "name", "short_name", "logo_url"],
      rows: teams.map((team) => team.proposedRow),
      sources: teams
    };

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(preview, null, 2)}\n`, "utf8");

    console.log(`Preview written: ${OUTPUT_PATH}`);
    console.log(`Teams: ${preview.rows.length}`);
    console.log(JSON.stringify(preview.rows, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
