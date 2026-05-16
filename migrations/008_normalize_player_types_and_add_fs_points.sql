UPDATE players
SET player_type = CASE
  WHEN player_type IN ('local', 'domestic', '本土') THEN 'local'
  WHEN player_type IN ('import', 'foreign', '洋將', '外籍球員（洋將）', '華裔') THEN 'import'
  WHEN player_type IN ('fs', '外籍生') THEN 'fs'
  ELSE player_type
END
WHERE player_type IS NOT NULL;

ALTER TABLE players
  DROP CONSTRAINT IF EXISTS players_player_type_check;

ALTER TABLE players
  ADD CONSTRAINT players_player_type_check
  CHECK (player_type IS NULL OR player_type IN ('local', 'import', 'fs'));

ALTER TABLE game_team_stats
  ADD COLUMN IF NOT EXISTS fs_points INTEGER CHECK (fs_points IS NULL OR fs_points >= 0);

ALTER TABLE game_team_period_stats
  ADD COLUMN IF NOT EXISTS fs_points INTEGER CHECK (fs_points IS NULL OR fs_points >= 0);
