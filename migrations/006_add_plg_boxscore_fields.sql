ALTER TABLE players
  ADD COLUMN IF NOT EXISTS official_player_id VARCHAR(80),
  ADD COLUMN IF NOT EXISTS person_id VARCHAR(80),
  ADD COLUMN IF NOT EXISTS random_id VARCHAR(80),
  ADD COLUMN IF NOT EXISTS english_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS jersey_number VARCHAR(20);

CREATE INDEX IF NOT EXISTS players_official_player_id_idx ON players(official_player_id);
CREATE INDEX IF NOT EXISTS players_person_id_idx ON players(person_id);
CREATE INDEX IF NOT EXISTS players_random_id_idx ON players(random_id);

ALTER TABLE games
  ADD COLUMN IF NOT EXISTS game_code VARCHAR(40),
  ADD COLUMN IF NOT EXISTS attendance INTEGER CHECK (attendance IS NULL OR attendance >= 0),
  ADD COLUMN IF NOT EXISTS capacity INTEGER CHECK (capacity IS NULL OR capacity >= 0);

CREATE INDEX IF NOT EXISTS games_game_code_idx ON games(game_code);

ALTER TABLE game_player_stats
  ADD COLUMN IF NOT EXISTS starter BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_points_made INTEGER CHECK (two_points_made IS NULL OR two_points_made >= 0),
  ADD COLUMN IF NOT EXISTS two_points_attempted INTEGER CHECK (two_points_attempted IS NULL OR two_points_attempted >= 0),
  ADD COLUMN IF NOT EXISTS two_points_percentage NUMERIC(6, 3),
  ADD COLUMN IF NOT EXISTS three_points_made INTEGER CHECK (three_points_made IS NULL OR three_points_made >= 0),
  ADD COLUMN IF NOT EXISTS three_points_attempted INTEGER CHECK (three_points_attempted IS NULL OR three_points_attempted >= 0),
  ADD COLUMN IF NOT EXISTS three_points_percentage NUMERIC(6, 3),
  ADD COLUMN IF NOT EXISTS free_throws_made INTEGER CHECK (free_throws_made IS NULL OR free_throws_made >= 0),
  ADD COLUMN IF NOT EXISTS free_throws_attempted INTEGER CHECK (free_throws_attempted IS NULL OR free_throws_attempted >= 0),
  ADD COLUMN IF NOT EXISTS free_throws_percentage NUMERIC(6, 3),
  ADD COLUMN IF NOT EXISTS offensive_rebounds INTEGER CHECK (offensive_rebounds IS NULL OR offensive_rebounds >= 0),
  ADD COLUMN IF NOT EXISTS defensive_rebounds INTEGER CHECK (defensive_rebounds IS NULL OR defensive_rebounds >= 0),
  ADD COLUMN IF NOT EXISTS personal_fouls INTEGER CHECK (personal_fouls IS NULL OR personal_fouls >= 0),
  ADD COLUMN IF NOT EXISTS efficiency INTEGER,
  ADD COLUMN IF NOT EXISTS assist_ratio NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS turnover_ratio NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS offensive_rating NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS defensive_rating NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS net_rating NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS offensive_possessions NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS opponent_offensive_possessions NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS opponent_points_from_second_chance INTEGER CHECK (
    opponent_points_from_second_chance IS NULL OR opponent_points_from_second_chance >= 0
  ),
  ADD COLUMN IF NOT EXISTS opponent_points_from_fastbreak INTEGER CHECK (
    opponent_points_from_fastbreak IS NULL OR opponent_points_from_fastbreak >= 0
  ),
  ADD COLUMN IF NOT EXISTS opponent_points_from_turnover INTEGER CHECK (
    opponent_points_from_turnover IS NULL OR opponent_points_from_turnover >= 0
  ),
  ADD COLUMN IF NOT EXISTS opponent_points_in_paint INTEGER CHECK (
    opponent_points_in_paint IS NULL OR opponent_points_in_paint >= 0
  ),
  ADD COLUMN IF NOT EXISTS pace NUMERIC(8, 3);

ALTER TABLE game_player_period_stats
  ADD COLUMN IF NOT EXISTS starter BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS steals INTEGER CHECK (steals IS NULL OR steals >= 0),
  ADD COLUMN IF NOT EXISTS blocks INTEGER CHECK (blocks IS NULL OR blocks >= 0),
  ADD COLUMN IF NOT EXISTS plus_minus INTEGER,
  ADD COLUMN IF NOT EXISTS two_points_made INTEGER CHECK (two_points_made IS NULL OR two_points_made >= 0),
  ADD COLUMN IF NOT EXISTS two_points_attempted INTEGER CHECK (two_points_attempted IS NULL OR two_points_attempted >= 0),
  ADD COLUMN IF NOT EXISTS two_points_percentage NUMERIC(6, 3),
  ADD COLUMN IF NOT EXISTS three_points_made INTEGER CHECK (three_points_made IS NULL OR three_points_made >= 0),
  ADD COLUMN IF NOT EXISTS three_points_attempted INTEGER CHECK (three_points_attempted IS NULL OR three_points_attempted >= 0),
  ADD COLUMN IF NOT EXISTS three_points_percentage NUMERIC(6, 3),
  ADD COLUMN IF NOT EXISTS free_throws_made INTEGER CHECK (free_throws_made IS NULL OR free_throws_made >= 0),
  ADD COLUMN IF NOT EXISTS free_throws_attempted INTEGER CHECK (free_throws_attempted IS NULL OR free_throws_attempted >= 0),
  ADD COLUMN IF NOT EXISTS free_throws_percentage NUMERIC(6, 3),
  ADD COLUMN IF NOT EXISTS offensive_rebounds INTEGER CHECK (offensive_rebounds IS NULL OR offensive_rebounds >= 0),
  ADD COLUMN IF NOT EXISTS defensive_rebounds INTEGER CHECK (defensive_rebounds IS NULL OR defensive_rebounds >= 0),
  ADD COLUMN IF NOT EXISTS personal_fouls INTEGER CHECK (personal_fouls IS NULL OR personal_fouls >= 0),
  ADD COLUMN IF NOT EXISTS efficiency INTEGER,
  ADD COLUMN IF NOT EXISTS assist_ratio NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS turnover_ratio NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS offensive_rating NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS defensive_rating NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS net_rating NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS offensive_possessions NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS opponent_offensive_possessions NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS opponent_points_from_second_chance INTEGER CHECK (
    opponent_points_from_second_chance IS NULL OR opponent_points_from_second_chance >= 0
  ),
  ADD COLUMN IF NOT EXISTS opponent_points_from_fastbreak INTEGER CHECK (
    opponent_points_from_fastbreak IS NULL OR opponent_points_from_fastbreak >= 0
  ),
  ADD COLUMN IF NOT EXISTS opponent_points_from_turnover INTEGER CHECK (
    opponent_points_from_turnover IS NULL OR opponent_points_from_turnover >= 0
  ),
  ADD COLUMN IF NOT EXISTS opponent_points_in_paint INTEGER CHECK (
    opponent_points_in_paint IS NULL OR opponent_points_in_paint >= 0
  ),
  ADD COLUMN IF NOT EXISTS pace NUMERIC(8, 3);

ALTER TABLE game_team_stats
  ADD COLUMN IF NOT EXISTS steals INTEGER CHECK (steals IS NULL OR steals >= 0),
  ADD COLUMN IF NOT EXISTS blocks INTEGER CHECK (blocks IS NULL OR blocks >= 0),
  ADD COLUMN IF NOT EXISTS offensive_rebounds INTEGER CHECK (offensive_rebounds IS NULL OR offensive_rebounds >= 0),
  ADD COLUMN IF NOT EXISTS defensive_rebounds INTEGER CHECK (defensive_rebounds IS NULL OR defensive_rebounds >= 0),
  ADD COLUMN IF NOT EXISTS personal_fouls INTEGER CHECK (personal_fouls IS NULL OR personal_fouls >= 0),
  ADD COLUMN IF NOT EXISTS efficiency INTEGER,
  ADD COLUMN IF NOT EXISTS two_points_made INTEGER CHECK (two_points_made IS NULL OR two_points_made >= 0),
  ADD COLUMN IF NOT EXISTS two_points_attempted INTEGER CHECK (two_points_attempted IS NULL OR two_points_attempted >= 0),
  ADD COLUMN IF NOT EXISTS two_points_percentage NUMERIC(6, 3),
  ADD COLUMN IF NOT EXISTS three_points_made INTEGER CHECK (three_points_made IS NULL OR three_points_made >= 0),
  ADD COLUMN IF NOT EXISTS three_points_attempted INTEGER CHECK (three_points_attempted IS NULL OR three_points_attempted >= 0),
  ADD COLUMN IF NOT EXISTS three_points_percentage NUMERIC(6, 3),
  ADD COLUMN IF NOT EXISTS free_throws_made INTEGER CHECK (free_throws_made IS NULL OR free_throws_made >= 0),
  ADD COLUMN IF NOT EXISTS free_throws_attempted INTEGER CHECK (free_throws_attempted IS NULL OR free_throws_attempted >= 0),
  ADD COLUMN IF NOT EXISTS free_throws_percentage NUMERIC(6, 3);

ALTER TABLE game_team_period_stats
  ADD COLUMN IF NOT EXISTS steals INTEGER CHECK (steals IS NULL OR steals >= 0),
  ADD COLUMN IF NOT EXISTS blocks INTEGER CHECK (blocks IS NULL OR blocks >= 0),
  ADD COLUMN IF NOT EXISTS offensive_rebounds INTEGER CHECK (offensive_rebounds IS NULL OR offensive_rebounds >= 0),
  ADD COLUMN IF NOT EXISTS defensive_rebounds INTEGER CHECK (defensive_rebounds IS NULL OR defensive_rebounds >= 0),
  ADD COLUMN IF NOT EXISTS personal_fouls INTEGER CHECK (personal_fouls IS NULL OR personal_fouls >= 0),
  ADD COLUMN IF NOT EXISTS efficiency INTEGER,
  ADD COLUMN IF NOT EXISTS two_points_made INTEGER CHECK (two_points_made IS NULL OR two_points_made >= 0),
  ADD COLUMN IF NOT EXISTS two_points_attempted INTEGER CHECK (two_points_attempted IS NULL OR two_points_attempted >= 0),
  ADD COLUMN IF NOT EXISTS two_points_percentage NUMERIC(6, 3),
  ADD COLUMN IF NOT EXISTS three_points_made INTEGER CHECK (three_points_made IS NULL OR three_points_made >= 0),
  ADD COLUMN IF NOT EXISTS three_points_attempted INTEGER CHECK (three_points_attempted IS NULL OR three_points_attempted >= 0),
  ADD COLUMN IF NOT EXISTS three_points_percentage NUMERIC(6, 3),
  ADD COLUMN IF NOT EXISTS free_throws_made INTEGER CHECK (free_throws_made IS NULL OR free_throws_made >= 0),
  ADD COLUMN IF NOT EXISTS free_throws_attempted INTEGER CHECK (free_throws_attempted IS NULL OR free_throws_attempted >= 0),
  ADD COLUMN IF NOT EXISTS free_throws_percentage NUMERIC(6, 3);
