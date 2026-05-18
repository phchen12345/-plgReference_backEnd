CREATE TABLE IF NOT EXISTS analytics_page_views (
  id BIGSERIAL PRIMARY KEY,
  visitor_id VARCHAR(120) NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_hash VARCHAR(64),
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_page_views_viewed_at_idx
  ON analytics_page_views(viewed_at);

CREATE INDEX IF NOT EXISTS analytics_page_views_path_idx
  ON analytics_page_views(path);

CREATE INDEX IF NOT EXISTS analytics_page_views_visitor_id_idx
  ON analytics_page_views(visitor_id);
