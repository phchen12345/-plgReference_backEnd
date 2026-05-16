ALTER TABLE game_team_stats
  ADD COLUMN IF NOT EXISTS points_in_paint INTEGER CHECK (
    points_in_paint IS NULL OR points_in_paint >= 0
  ),
  ADD COLUMN IF NOT EXISTS points_from_second_chance INTEGER CHECK (
    points_from_second_chance IS NULL OR points_from_second_chance >= 0
  ),
  ADD COLUMN IF NOT EXISTS points_from_fastbreak INTEGER CHECK (
    points_from_fastbreak IS NULL OR points_from_fastbreak >= 0
  );
