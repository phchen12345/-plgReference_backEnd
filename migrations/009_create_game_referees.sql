CREATE TABLE IF NOT EXISTS game_referees (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  role VARCHAR(40) NOT NULL,
  name VARCHAR(80) NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order BETWEEN 1 AND 3),
  CONSTRAINT game_referees_game_role_unique UNIQUE (game_id, role),
  CONSTRAINT game_referees_game_sort_unique UNIQUE (game_id, sort_order)
);

CREATE INDEX IF NOT EXISTS game_referees_game_id_idx ON game_referees(game_id);
