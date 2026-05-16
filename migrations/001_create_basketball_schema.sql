CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  league VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(80),
  abbreviation VARCHAR(16),
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT teams_league_name_unique UNIQUE (league, name)
);

CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  league VARCHAR(40) NOT NULL,
  season VARCHAR(20) NOT NULL,
  game_date TIMESTAMPTZ NOT NULL,
  home_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  away_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  venue VARCHAR(160),
  home_score INTEGER CHECK (home_score IS NULL OR home_score >= 0),
  away_score INTEGER CHECK (away_score IS NULL OR away_score >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT games_different_teams CHECK (home_team_id <> away_team_id),
  CONSTRAINT games_unique_matchup UNIQUE (league, season, game_date, home_team_id, away_team_id),
  CONSTRAINT games_status_check CHECK (status IN ('scheduled', 'live', 'final', 'postponed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS games_game_date_idx ON games(game_date);
CREATE INDEX IF NOT EXISTS games_league_season_idx ON games(league, season);
CREATE INDEX IF NOT EXISTS games_home_team_id_idx ON games(home_team_id);
CREATE INDEX IF NOT EXISTS games_away_team_id_idx ON games(away_team_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS teams_set_updated_at ON teams;
CREATE TRIGGER teams_set_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS games_set_updated_at ON games;
CREATE TRIGGER games_set_updated_at
BEFORE UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
