DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'players_team_name_unique'
  ) THEN
    ALTER TABLE players
      ADD CONSTRAINT players_team_name_unique UNIQUE (team_id, name);
  END IF;
END;
$$;
