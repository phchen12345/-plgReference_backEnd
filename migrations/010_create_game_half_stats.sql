CREATE TABLE IF NOT EXISTS game_team_half_stats (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  half INTEGER NOT NULL CHECK (half IN (1, 2)),
  points INTEGER CHECK (points IS NULL OR points >= 0),
  rebounds INTEGER CHECK (rebounds IS NULL OR rebounds >= 0),
  assists INTEGER CHECK (assists IS NULL OR assists >= 0),
  turnovers INTEGER CHECK (turnovers IS NULL OR turnovers >= 0),
  local_points INTEGER CHECK (local_points IS NULL OR local_points >= 0),
  import_points INTEGER CHECK (import_points IS NULL OR import_points >= 0),
  fs_points INTEGER CHECK (fs_points IS NULL OR fs_points >= 0),
  offensive_rating NUMERIC(8, 3),
  defensive_rating NUMERIC(8, 3),
  net_rating NUMERIC(8, 3),
  steals INTEGER CHECK (steals IS NULL OR steals >= 0),
  blocks INTEGER CHECK (blocks IS NULL OR blocks >= 0),
  offensive_rebounds INTEGER CHECK (offensive_rebounds IS NULL OR offensive_rebounds >= 0),
  defensive_rebounds INTEGER CHECK (defensive_rebounds IS NULL OR defensive_rebounds >= 0),
  personal_fouls INTEGER CHECK (personal_fouls IS NULL OR personal_fouls >= 0),
  efficiency INTEGER,
  two_points_made INTEGER CHECK (two_points_made IS NULL OR two_points_made >= 0),
  two_points_attempted INTEGER CHECK (two_points_attempted IS NULL OR two_points_attempted >= 0),
  two_points_percentage NUMERIC(6, 3),
  three_points_made INTEGER CHECK (three_points_made IS NULL OR three_points_made >= 0),
  three_points_attempted INTEGER CHECK (three_points_attempted IS NULL OR three_points_attempted >= 0),
  three_points_percentage NUMERIC(6, 3),
  free_throws_made INTEGER CHECK (free_throws_made IS NULL OR free_throws_made >= 0),
  free_throws_attempted INTEGER CHECK (free_throws_attempted IS NULL OR free_throws_attempted >= 0),
  free_throws_percentage NUMERIC(6, 3),
  CONSTRAINT game_team_half_stats_unique UNIQUE (game_id, team_id, half)
);

CREATE TABLE IF NOT EXISTS game_player_half_stats (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  half INTEGER NOT NULL CHECK (half IN (1, 2)),
  minutes NUMERIC(5, 2),
  points INTEGER CHECK (points IS NULL OR points >= 0),
  rebounds INTEGER CHECK (rebounds IS NULL OR rebounds >= 0),
  assists INTEGER CHECK (assists IS NULL OR assists >= 0),
  turnovers INTEGER CHECK (turnovers IS NULL OR turnovers >= 0),
  starter BOOLEAN NOT NULL DEFAULT false,
  steals INTEGER CHECK (steals IS NULL OR steals >= 0),
  blocks INTEGER CHECK (blocks IS NULL OR blocks >= 0),
  plus_minus INTEGER,
  two_points_made INTEGER CHECK (two_points_made IS NULL OR two_points_made >= 0),
  two_points_attempted INTEGER CHECK (two_points_attempted IS NULL OR two_points_attempted >= 0),
  two_points_percentage NUMERIC(6, 3),
  three_points_made INTEGER CHECK (three_points_made IS NULL OR three_points_made >= 0),
  three_points_attempted INTEGER CHECK (three_points_attempted IS NULL OR three_points_attempted >= 0),
  three_points_percentage NUMERIC(6, 3),
  free_throws_made INTEGER CHECK (free_throws_made IS NULL OR free_throws_made >= 0),
  free_throws_attempted INTEGER CHECK (free_throws_attempted IS NULL OR free_throws_attempted >= 0),
  free_throws_percentage NUMERIC(6, 3),
  offensive_rebounds INTEGER CHECK (offensive_rebounds IS NULL OR offensive_rebounds >= 0),
  defensive_rebounds INTEGER CHECK (defensive_rebounds IS NULL OR defensive_rebounds >= 0),
  personal_fouls INTEGER CHECK (personal_fouls IS NULL OR personal_fouls >= 0),
  efficiency INTEGER,
  assist_ratio NUMERIC(8, 3),
  turnover_ratio NUMERIC(8, 3),
  offensive_rating NUMERIC(8, 3),
  defensive_rating NUMERIC(8, 3),
  net_rating NUMERIC(8, 3),
  offensive_possessions NUMERIC(8, 3),
  opponent_offensive_possessions NUMERIC(8, 3),
  opponent_points_from_second_chance INTEGER CHECK (
    opponent_points_from_second_chance IS NULL OR opponent_points_from_second_chance >= 0
  ),
  opponent_points_from_fastbreak INTEGER CHECK (
    opponent_points_from_fastbreak IS NULL OR opponent_points_from_fastbreak >= 0
  ),
  opponent_points_from_turnover INTEGER CHECK (
    opponent_points_from_turnover IS NULL OR opponent_points_from_turnover >= 0
  ),
  opponent_points_in_paint INTEGER CHECK (
    opponent_points_in_paint IS NULL OR opponent_points_in_paint >= 0
  ),
  pace NUMERIC(8, 3),
  CONSTRAINT game_player_half_stats_unique UNIQUE (game_id, player_id, half)
);

CREATE INDEX IF NOT EXISTS game_team_half_stats_game_id_idx ON game_team_half_stats(game_id);
CREATE INDEX IF NOT EXISTS game_player_half_stats_game_id_idx ON game_player_half_stats(game_id);
CREATE INDEX IF NOT EXISTS game_player_half_stats_player_id_idx ON game_player_half_stats(player_id);
