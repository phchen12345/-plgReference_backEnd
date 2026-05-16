DROP TABLE IF EXISTS game_player_period_stats CASCADE;
DROP TABLE IF EXISTS game_player_stats CASCADE;
DROP TABLE IF EXISTS game_team_period_stats CASCADE;
DROP TABLE IF EXISTS game_team_stats CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

CREATE TABLE leagues (
  id SERIAL PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL
);

CREATE TABLE seasons (
  id SERIAL PRIMARY KEY,
  league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  CONSTRAINT seasons_league_name_unique UNIQUE (league_id, name)
);

CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  short_name VARCHAR(60),
  logo_url TEXT,
  CONSTRAINT teams_league_name_unique UNIQUE (league_id, name)
);

CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  player_type VARCHAR(40),
  position VARCHAR(40),
  CONSTRAINT players_team_name_unique UNIQUE (team_id, name)
);

CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  external_game_id VARCHAR(80),
  game_date DATE NOT NULL,
  game_time TIME,
  home_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  away_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
  home_score INTEGER CHECK (home_score IS NULL OR home_score >= 0),
  away_score INTEGER CHECK (away_score IS NULL OR away_score >= 0),
  CONSTRAINT games_different_teams CHECK (home_team_id <> away_team_id),
  CONSTRAINT games_external_game_unique UNIQUE (league_id, external_game_id)
);

CREATE TABLE game_team_stats (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  points INTEGER CHECK (points IS NULL OR points >= 0),
  rebounds INTEGER CHECK (rebounds IS NULL OR rebounds >= 0),
  assists INTEGER CHECK (assists IS NULL OR assists >= 0),
  turnovers INTEGER CHECK (turnovers IS NULL OR turnovers >= 0),
  local_points INTEGER CHECK (local_points IS NULL OR local_points >= 0),
  import_points INTEGER CHECK (import_points IS NULL OR import_points >= 0),
  offensive_rating NUMERIC(8, 3),
  defensive_rating NUMERIC(8, 3),
  net_rating NUMERIC(8, 3),
  CONSTRAINT game_team_stats_game_team_unique UNIQUE (game_id, team_id)
);

CREATE TABLE game_team_period_stats (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  period INTEGER NOT NULL CHECK (period >= 1),
  points INTEGER CHECK (points IS NULL OR points >= 0),
  rebounds INTEGER CHECK (rebounds IS NULL OR rebounds >= 0),
  assists INTEGER CHECK (assists IS NULL OR assists >= 0),
  turnovers INTEGER CHECK (turnovers IS NULL OR turnovers >= 0),
  local_points INTEGER CHECK (local_points IS NULL OR local_points >= 0),
  import_points INTEGER CHECK (import_points IS NULL OR import_points >= 0),
  CONSTRAINT game_team_period_stats_unique UNIQUE (game_id, team_id, period)
);

CREATE TABLE game_player_stats (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  minutes NUMERIC(5, 2),
  points INTEGER CHECK (points IS NULL OR points >= 0),
  rebounds INTEGER CHECK (rebounds IS NULL OR rebounds >= 0),
  assists INTEGER CHECK (assists IS NULL OR assists >= 0),
  steals INTEGER CHECK (steals IS NULL OR steals >= 0),
  blocks INTEGER CHECK (blocks IS NULL OR blocks >= 0),
  turnovers INTEGER CHECK (turnovers IS NULL OR turnovers >= 0),
  plus_minus INTEGER,
  true_shooting_percentage NUMERIC(6, 3),
  usage_percentage NUMERIC(6, 3),
  CONSTRAINT game_player_stats_game_player_unique UNIQUE (game_id, player_id)
);

CREATE TABLE game_player_period_stats (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  period INTEGER NOT NULL CHECK (period >= 1),
  minutes NUMERIC(5, 2),
  points INTEGER CHECK (points IS NULL OR points >= 0),
  rebounds INTEGER CHECK (rebounds IS NULL OR rebounds >= 0),
  assists INTEGER CHECK (assists IS NULL OR assists >= 0),
  turnovers INTEGER CHECK (turnovers IS NULL OR turnovers >= 0),
  CONSTRAINT game_player_period_stats_unique UNIQUE (game_id, player_id, period)
);

CREATE INDEX games_league_id_idx ON games(league_id);
CREATE INDEX games_season_id_idx ON games(season_id);
CREATE INDEX games_game_date_idx ON games(game_date);
CREATE INDEX games_home_team_id_idx ON games(home_team_id);
CREATE INDEX games_away_team_id_idx ON games(away_team_id);
CREATE INDEX players_league_id_idx ON players(league_id);
CREATE INDEX players_team_id_idx ON players(team_id);
CREATE INDEX game_team_stats_game_id_idx ON game_team_stats(game_id);
CREATE INDEX game_player_stats_game_id_idx ON game_player_stats(game_id);
CREATE INDEX game_player_stats_player_id_idx ON game_player_stats(player_id);
