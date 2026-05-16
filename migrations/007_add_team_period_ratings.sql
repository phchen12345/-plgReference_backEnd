ALTER TABLE game_team_period_stats
  ADD COLUMN IF NOT EXISTS offensive_rating NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS defensive_rating NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS net_rating NUMERIC(8, 3);
