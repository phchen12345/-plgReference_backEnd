ALTER TABLE games
  ADD COLUMN IF NOT EXISTS stage VARCHAR(30) NOT NULL DEFAULT 'regular_season';

ALTER TABLE games
  DROP CONSTRAINT IF EXISTS games_stage_check;

ALTER TABLE games
  ADD CONSTRAINT games_stage_check
  CHECK (stage IN ('preseason', 'regular_season', 'playoffs', 'finals'));

CREATE INDEX IF NOT EXISTS games_stage_idx ON games(stage);
