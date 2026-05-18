const crypto = require("crypto");

const { query, queryOne } = require("../db/query");

const DEFAULT_IP_HASH_SALT = "plg-reference-analytics";

function clean(value) {
  return String(value || "").trim();
}

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getIpHash(ip) {
  const text = clean(ip);

  if (!text) {
    return null;
  }

  const salt = process.env.ANALYTICS_IP_HASH_SALT || DEFAULT_IP_HASH_SALT;
  return hash(`${salt}:${text}`);
}

function getFallbackVisitorId(ip, userAgent) {
  return `anonymous:${hash(`${clean(ip)}:${clean(userAgent)}`).slice(0, 32)}`;
}

function normalizePath(path) {
  const text = clean(path);

  if (!text) {
    return "/";
  }

  if (text.startsWith("http://") || text.startsWith("https://")) {
    try {
      const url = new URL(text);
      return `${url.pathname}${url.search}`;
    } catch {
      return "/";
    }
  }

  return text.startsWith("/") ? text : `/${text}`;
}

async function trackPageView(payload, context) {
  const path = normalizePath(payload.path);
  const userAgent = clean(context.userAgent).slice(0, 1000) || null;
  const visitorId = clean(payload.visitorId).slice(0, 120) || getFallbackVisitorId(context.ip, userAgent);
  const referrer = clean(payload.referrer).slice(0, 1000) || null;
  const ipHash = getIpHash(context.ip);

  const row = await queryOne(
    `
      INSERT INTO analytics_page_views (
        visitor_id,
        path,
        referrer,
        user_agent,
        ip_hash
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, visitor_id, path, viewed_at
    `,
    [visitorId, path, referrer, userAgent, ipHash]
  );

  return {
    tracked: true,
    id: row.id,
    visitorId: row.visitor_id,
    path: row.path,
    viewedAt: row.viewed_at
  };
}

function buildAnalyticsConditions(filters) {
  const conditions = [];
  const values = [];

  if (filters.from) {
    values.push(filters.from);
    conditions.push(`viewed_at >= $${values.length}`);
  }

  if (filters.to) {
    values.push(filters.to);
    conditions.push(`viewed_at <= $${values.length}`);
  }

  if (filters.path) {
    values.push(normalizePath(filters.path));
    conditions.push(`path = $${values.length}`);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    values
  };
}

async function getSummary(filters = {}) {
  const { where, values } = buildAnalyticsConditions(filters);
  const limit = filters.limit || 10;
  const base = await queryOne(
    `
      SELECT
        COUNT(*)::int AS total_page_views,
        COUNT(DISTINCT visitor_id)::int AS unique_visitors
      FROM analytics_page_views
      ${where}
    `,
    values
  );
  const today = await queryOne(
    `
      SELECT
        COUNT(*)::int AS today_page_views,
        COUNT(DISTINCT visitor_id)::int AS today_unique_visitors
      FROM analytics_page_views
      WHERE viewed_at >= date_trunc('day', NOW())
    `
  );
  const topPaths = await query(
    `
      SELECT
        path,
        COUNT(*)::int AS page_views,
        COUNT(DISTINCT visitor_id)::int AS unique_visitors
      FROM analytics_page_views
      ${where}
      GROUP BY path
      ORDER BY page_views DESC, path ASC
      LIMIT $${values.length + 1}
    `,
    [...values, limit]
  );

  return {
    totalPageViews: base.total_page_views,
    uniqueVisitors: base.unique_visitors,
    todayPageViews: today.today_page_views,
    todayUniqueVisitors: today.today_unique_visitors,
    topPaths: topPaths.map((row) => ({
      path: row.path,
      pageViews: row.page_views,
      uniqueVisitors: row.unique_visitors
    }))
  };
}

module.exports = {
  getSummary,
  trackPageView
};
