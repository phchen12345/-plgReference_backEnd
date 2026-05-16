ALTER TABLE game_player_stats
  ADD COLUMN IF NOT EXISTS effective_field_goal_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS three_point_attempt_rate NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS free_throw_rate NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS offensive_rebound_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS defensive_rebound_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS total_rebound_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS assist_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS steal_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS block_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS turnover_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS game_score NUMERIC(8, 3);

ALTER TABLE game_player_period_stats
  ADD COLUMN IF NOT EXISTS true_shooting_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS effective_field_goal_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS three_point_attempt_rate NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS free_throw_rate NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS offensive_rebound_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS defensive_rebound_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS total_rebound_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS assist_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS steal_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS block_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS turnover_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS usage_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS game_score NUMERIC(8, 3);

ALTER TABLE game_player_half_stats
  ADD COLUMN IF NOT EXISTS true_shooting_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS effective_field_goal_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS three_point_attempt_rate NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS free_throw_rate NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS offensive_rebound_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS defensive_rebound_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS total_rebound_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS assist_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS steal_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS block_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS turnover_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS usage_percentage NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS game_score NUMERIC(8, 3);
