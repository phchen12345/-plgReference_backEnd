CREATE OR REPLACE FUNCTION calculate_player_half_plus_minus(
  target_game_id INTEGER,
  target_player_id INTEGER,
  target_half INTEGER
)
RETURNS INTEGER AS $$
  SELECT
    CASE
      WHEN COUNT(gpps.plus_minus) = 0 THEN NULL
      ELSE COALESCE(SUM(gpps.plus_minus), 0)::INTEGER
    END
  FROM game_player_period_stats gpps
  WHERE gpps.game_id = target_game_id
    AND gpps.player_id = target_player_id
    AND gpps.period = ANY (
      CASE
        WHEN target_half = 1 THEN ARRAY[1, 2]
        WHEN target_half = 2 THEN ARRAY[3, 4]
        ELSE ARRAY[]::INTEGER[]
      END
    );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION set_game_player_half_plus_minus_from_periods()
RETURNS TRIGGER AS $$
DECLARE
  calculated_plus_minus INTEGER;
BEGIN
  calculated_plus_minus := calculate_player_half_plus_minus(
    NEW.game_id,
    NEW.player_id,
    NEW.half
  );

  IF calculated_plus_minus IS NOT NULL THEN
    NEW.plus_minus := calculated_plus_minus;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_game_player_half_plus_minus_from_period()
RETURNS TRIGGER AS $$
DECLARE
  target_game_id INTEGER;
  target_player_id INTEGER;
  target_period INTEGER;
  target_half INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_game_id := OLD.game_id;
    target_player_id := OLD.player_id;
    target_period := OLD.period;
  ELSE
    target_game_id := NEW.game_id;
    target_player_id := NEW.player_id;
    target_period := NEW.period;
  END IF;

  target_half :=
    CASE
      WHEN target_period IN (1, 2) THEN 1
      WHEN target_period IN (3, 4) THEN 2
      ELSE NULL
    END;

  IF target_half IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE game_player_half_stats gphs
  SET plus_minus = calculate_player_half_plus_minus(
    target_game_id,
    target_player_id,
    target_half
  )
  WHERE gphs.game_id = target_game_id
    AND gphs.player_id = target_player_id
    AND gphs.half = target_half;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_game_player_half_plus_minus_from_periods_trigger
  ON game_player_half_stats;

CREATE TRIGGER set_game_player_half_plus_minus_from_periods_trigger
BEFORE INSERT OR UPDATE OF game_id, player_id, half, plus_minus
ON game_player_half_stats
FOR EACH ROW
EXECUTE FUNCTION set_game_player_half_plus_minus_from_periods();

DROP TRIGGER IF EXISTS refresh_game_player_half_plus_minus_from_period_trigger
  ON game_player_period_stats;

CREATE TRIGGER refresh_game_player_half_plus_minus_from_period_trigger
AFTER INSERT OR UPDATE OF game_id, player_id, period, plus_minus OR DELETE
ON game_player_period_stats
FOR EACH ROW
EXECUTE FUNCTION refresh_game_player_half_plus_minus_from_period();
