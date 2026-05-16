const fs = require("fs");
const path = require("path");

const pool = require("../src/db/pool");

const BASE_URL = "https://pleagueofficial.com";
const PRECISER_API_BASE_URL = "https://api.preciser.io";
const OUTPUT_PATH = path.join(__dirname, "..", "previews", "plg-player-stats-import-summary.json");
const IMPORT_MISSING_ONLY = process.env.PLG_IMPORT_MISSING_ONLY === "true";
const PERIODS = [
  { period: 1, tab: "q1" },
  { period: 2, tab: "q2" },
  { period: 3, tab: "q3" },
  { period: 4, tab: "q4" }
];
const HALVES = [
  { half: 1, tab: "1st half" },
  { half: 2, tab: "2nd half" }
];
const OFFICIAL_PLAYER_TYPE_MAP = new Map([
  ["local", "local"],
  ["domestic", "local"],
  ["\u672c\u571f", "local"],
  ["import", "import"],
  ["foreign", "import"],
  ["\u6d0b\u5c07", "import"],
  ["\u5916\u7c4d\u7403\u54e1\uff08\u6d0b\u5c07\uff09", "import"],
  ["\u83ef\u88d4", "import"],
  ["fs", "fs"],
  ["\u5916\u7c4d\u751f", "fs"]
]);
const NORMALIZED_PLAYER_TYPES = new Set(["local", "import", "fs"]);
const PLAYER_TYPE_OVERRIDES = new Map([
  // PLG player page has an empty identity field for Ray McCallum.
  ["1pdCyRJz", "import"]
]);
const MAPPED_OFFICIAL_FIELDS = [
  "player_id",
  "personId",
  "random_id",
  "jersey",
  "starter",
  "points",
  "positive",
  "turnover",
  "ast",
  "blk",
  "reb",
  "reb_o",
  "reb_d",
  "stl",
  "pfoul",
  "eff",
  "mins",
  "two",
  "two_m_two",
  "twop",
  "trey",
  "trey_m_trey",
  "treyp",
  "ft",
  "ft_m_ft",
  "ftp",
  "AST_RATIO",
  "DRTG",
  "NETRTG",
  "ORTG",
  "TO_RATIO",
  "offensive_possession",
  "opp_offensive_possession",
  "opp_points_from_2nd_chance",
  "opp_points_from_fastbreak",
  "opp_points_from_turnover",
  "opp_points_in_the_paint",
  "pace"
];

const PLAYER_ADVANCED_STAT_COLUMNS = [
  "true_shooting_percentage",
  "effective_field_goal_percentage",
  "three_point_attempt_rate",
  "free_throw_rate",
  "offensive_rebound_percentage",
  "defensive_rebound_percentage",
  "total_rebound_percentage",
  "assist_percentage",
  "steal_percentage",
  "block_percentage",
  "turnover_percentage",
  "usage_percentage",
  "game_score"
];

const PLAYER_STAT_COLUMNS = [
  "game_id",
  "team_id",
  "player_id",
  "minutes",
  "points",
  "rebounds",
  "assists",
  "steals",
  "blocks",
  "turnovers",
  "plus_minus",
  ...PLAYER_ADVANCED_STAT_COLUMNS,
  "starter",
  "two_points_made",
  "two_points_attempted",
  "two_points_percentage",
  "three_points_made",
  "three_points_attempted",
  "three_points_percentage",
  "free_throws_made",
  "free_throws_attempted",
  "free_throws_percentage",
  "offensive_rebounds",
  "defensive_rebounds",
  "personal_fouls",
  "efficiency",
  "assist_ratio",
  "turnover_ratio",
  "offensive_rating",
  "defensive_rating",
  "net_rating",
  "offensive_possessions",
  "opponent_offensive_possessions",
  "opponent_points_from_second_chance",
  "opponent_points_from_fastbreak",
  "opponent_points_from_turnover",
  "opponent_points_in_paint",
  "pace"
];

const PLAYER_PERIOD_STAT_COLUMNS = [
  "game_id",
  "team_id",
  "player_id",
  "period",
  "minutes",
  "points",
  "rebounds",
  "assists",
  "turnovers",
  "starter",
  "steals",
  "blocks",
  "plus_minus",
  ...PLAYER_ADVANCED_STAT_COLUMNS,
  "two_points_made",
  "two_points_attempted",
  "two_points_percentage",
  "three_points_made",
  "three_points_attempted",
  "three_points_percentage",
  "free_throws_made",
  "free_throws_attempted",
  "free_throws_percentage",
  "offensive_rebounds",
  "defensive_rebounds",
  "personal_fouls",
  "efficiency",
  "assist_ratio",
  "turnover_ratio",
  "offensive_rating",
  "defensive_rating",
  "net_rating",
  "offensive_possessions",
  "opponent_offensive_possessions",
  "opponent_points_from_second_chance",
  "opponent_points_from_fastbreak",
  "opponent_points_from_turnover",
  "opponent_points_in_paint",
  "pace"
];
const PLAYER_HALF_STAT_COLUMNS = PLAYER_PERIOD_STAT_COLUMNS.map((column) =>
  column === "period" ? "half" : column
);

const TEAM_STAT_COLUMNS = [
  "game_id",
  "team_id",
  "points",
  "rebounds",
  "assists",
  "turnovers",
  "local_points",
  "import_points",
  "fs_points",
  "points_in_paint",
  "points_from_second_chance",
  "points_from_fastbreak",
  "offensive_rating",
  "defensive_rating",
  "net_rating",
  "steals",
  "blocks",
  "offensive_rebounds",
  "defensive_rebounds",
  "personal_fouls",
  "efficiency",
  "two_points_made",
  "two_points_attempted",
  "two_points_percentage",
  "three_points_made",
  "three_points_attempted",
  "three_points_percentage",
  "free_throws_made",
  "free_throws_attempted",
  "free_throws_percentage"
];

const TEAM_PERIOD_STAT_COLUMNS = [
  "game_id",
  "team_id",
  "period",
  "points",
  "rebounds",
  "assists",
  "turnovers",
  "local_points",
  "import_points",
  "fs_points",
  "offensive_rating",
  "defensive_rating",
  "net_rating",
  "steals",
  "blocks",
  "offensive_rebounds",
  "defensive_rebounds",
  "personal_fouls",
  "efficiency",
  "two_points_made",
  "two_points_attempted",
  "two_points_percentage",
  "three_points_made",
  "three_points_attempted",
  "three_points_percentage",
  "free_throws_made",
  "free_throws_attempted",
  "free_throws_percentage"
];
const TEAM_HALF_STAT_COLUMNS = TEAM_PERIOD_STAT_COLUMNS.map((column) =>
  column === "period" ? "half" : column
);

function clean(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function nullableText(value) {
  const text = clean(value);

  return text || null;
}

function toInteger(value, fallback = 0) {
  const text = clean(value);

  if (/^-?\d+$/.test(text)) {
    return Number(text);
  }

  return fallback;
}

function toNullableInteger(value) {
  const text = clean(value);

  if (/^-?\d+$/.test(text)) {
    return Number(text);
  }

  return null;
}

function toNullableNumber(value) {
  const text = clean(value);

  if (!text || Number.isNaN(Number(text))) {
    return null;
  }

  return Number(Number(text).toFixed(3));
}

function toMinutes(value) {
  const text = clean(value);

  if (!text || text.toUpperCase() === "DNP") {
    return 0;
  }

  const match = text.match(/^(\d+):(\d{2})$/);

  if (!match) {
    return toNullableNumber(text);
  }

  return Number((Number(match[1]) + Number(match[2]) / 60).toFixed(2));
}

function toStarter(value) {
  const text = clean(value).toLowerCase();

  return Boolean(text && text !== "0" && text !== "false");
}

function parseMadeAttempt(value, attemptedFallback) {
  const text = clean(value);
  const match = text.match(/^(\d+)\s*-\s*(\d+)$/);

  if (match) {
    return {
      made: Number(match[1]),
      attempted: Number(match[2])
    };
  }

  return {
    made: 0,
    attempted: toInteger(attemptedFallback)
  };
}

function calculatePercentage(made, attempted) {
  if (!attempted) {
    return null;
  }

  return Number(((made / attempted) * 100).toFixed(3));
}

function round3(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return Number(value.toFixed(3));
}

function divide(numerator, denominator) {
  if (!denominator) {
    return null;
  }

  return numerator / denominator;
}

function scale(value, multiplier) {
  return value === null ? null : value * multiplier;
}

function toPercentage(value, made, attempted) {
  const officialValue = toNullableNumber(value);

  if (officialValue !== null) {
    return officialValue;
  }

  return calculatePercentage(made, attempted);
}

function normalizeOfficialPlayerType(value) {
  const text = clean(value).replace(/^\u8eab\u4efd\uff1a\s*/, "");

  if (!text || text.includes("\u5e73\u5747")) {
    return null;
  }

  return OFFICIAL_PLAYER_TYPE_MAP.get(text.toLowerCase()) || OFFICIAL_PLAYER_TYPE_MAP.get(text) || null;
}

function getPlayerScoringGroup(playerType) {
  const normalizedType = normalizeOfficialPlayerType(playerType);

  if (NORMALIZED_PLAYER_TYPES.has(normalizedType)) {
    return normalizedType;
  }

  return null;
}

function normalizePlayer(apiPlayer, playerType = null) {
  const twoPoints = parseMadeAttempt(apiPlayer.two_m_two, apiPlayer.two);
  const threePoints = parseMadeAttempt(apiPlayer.trey_m_trey, apiPlayer.trey);
  const freeThrows = parseMadeAttempt(apiPlayer.ft_m_ft, apiPlayer.ft);

  return {
    officialPlayerId: nullableText(apiPlayer.player_id),
    personId: nullableText(apiPlayer.personId),
    randomId: nullableText(apiPlayer.random_id),
    playerType,
    englishName: nullableText(apiPlayer.english_name || apiPlayer.englishName),
    jerseyNumber: nullableText(apiPlayer.jersey),
    name: clean(apiPlayer.name_alt || apiPlayer.name),
    starter: toStarter(apiPlayer.starter),
    minutes: toMinutes(apiPlayer.mins),
    points: toInteger(apiPlayer.points),
    rebounds: toInteger(apiPlayer.reb),
    assists: toInteger(apiPlayer.ast),
    steals: toInteger(apiPlayer.stl),
    blocks: toInteger(apiPlayer.blk),
    turnovers: toInteger(apiPlayer.turnover),
    plusMinus: toNullableInteger(apiPlayer.positive),
    trueShootingPercentage: null,
    effectiveFieldGoalPercentage: null,
    threePointAttemptRate: null,
    freeThrowRate: null,
    offensiveReboundPercentage: null,
    defensiveReboundPercentage: null,
    totalReboundPercentage: null,
    assistPercentage: null,
    stealPercentage: null,
    blockPercentage: null,
    turnoverPercentage: null,
    usagePercentage: null,
    gameScore: null,
    twoPointsMade: twoPoints.made,
    twoPointsAttempted: twoPoints.attempted,
    twoPointsPercentage: toPercentage(apiPlayer.twop, twoPoints.made, twoPoints.attempted),
    threePointsMade: threePoints.made,
    threePointsAttempted: threePoints.attempted,
    threePointsPercentage: toPercentage(apiPlayer.treyp, threePoints.made, threePoints.attempted),
    freeThrowsMade: freeThrows.made,
    freeThrowsAttempted: freeThrows.attempted,
    freeThrowsPercentage: toPercentage(apiPlayer.ftp, freeThrows.made, freeThrows.attempted),
    offensiveRebounds: toInteger(apiPlayer.reb_o),
    defensiveRebounds: toInteger(apiPlayer.reb_d),
    personalFouls: toInteger(apiPlayer.pfoul),
    efficiency: toInteger(apiPlayer.eff),
    assistRatio: toNullableNumber(apiPlayer.AST_RATIO),
    turnoverRatio: toNullableNumber(apiPlayer.TO_RATIO),
    offensiveRating: toNullableNumber(apiPlayer.ORTG),
    defensiveRating: toNullableNumber(apiPlayer.DRTG),
    netRating: toNullableNumber(apiPlayer.NETRTG),
    offensivePossessions: toNullableNumber(apiPlayer.offensive_possession),
    opponentOffensivePossessions: toNullableNumber(apiPlayer.opp_offensive_possession),
    opponentPointsFromSecondChance: toNullableInteger(apiPlayer.opp_points_from_2nd_chance),
    opponentPointsFromFastbreak: toNullableInteger(apiPlayer.opp_points_from_fastbreak),
    opponentPointsFromTurnover: toNullableInteger(apiPlayer.opp_points_from_turnover),
    opponentPointsInPaint: toNullableInteger(apiPlayer.opp_points_in_the_paint),
    pace: toNullableNumber(apiPlayer.pace)
  };
}

function emptyTeamTotals() {
  return {
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    offensiveRebounds: 0,
    defensiveRebounds: 0,
    personalFouls: 0,
    efficiency: 0,
    minutes: 0,
    twoPointsMade: 0,
    twoPointsAttempted: 0,
    threePointsMade: 0,
    threePointsAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0,
    offensiveRating: null,
    defensiveRating: null,
    netRating: null,
    localPoints: 0,
    importPoints: 0,
    fsPoints: 0,
    pointsInPaint: null,
    pointsFromSecondChance: null,
    pointsFromFastbreak: null,
    hasPlayerTypes: false,
    hasUnclassifiedPlayerPoints: false
  };
}

function addToTeamTotals(totals, player, playerType) {
  totals.points += player.points;
  totals.rebounds += player.rebounds;
  totals.assists += player.assists;
  totals.steals += player.steals;
  totals.blocks += player.blocks;
  totals.turnovers += player.turnovers;
  totals.offensiveRebounds += player.offensiveRebounds;
  totals.defensiveRebounds += player.defensiveRebounds;
  totals.personalFouls += player.personalFouls;
  totals.efficiency += player.efficiency;
  totals.minutes += player.minutes;
  totals.twoPointsMade += player.twoPointsMade;
  totals.twoPointsAttempted += player.twoPointsAttempted;
  totals.threePointsMade += player.threePointsMade;
  totals.threePointsAttempted += player.threePointsAttempted;
  totals.freeThrowsMade += player.freeThrowsMade;
  totals.freeThrowsAttempted += player.freeThrowsAttempted;

  if (playerType) {
    totals.hasPlayerTypes = true;
  }

  const scoringGroup = getPlayerScoringGroup(playerType);

  if (scoringGroup === "local") {
    totals.localPoints += player.points;
  }

  if (scoringGroup === "import") {
    totals.importPoints += player.points;
  }

  if (scoringGroup === "fs") {
    totals.fsPoints += player.points;
  }

  if (!scoringGroup && player.points > 0) {
    totals.hasUnclassifiedPlayerPoints = true;
  }
}

function calculateEstimatedPossessions(totals) {
  const possessions =
    totals.twoPointsAttempted +
    totals.threePointsAttempted +
    totals.freeThrowsAttempted * 0.44 -
    totals.offensiveRebounds +
    totals.turnovers;

  if (possessions <= 0) {
    return null;
  }

  return Number(possessions.toFixed(3));
}

function calculateRating(points, possessions) {
  if (!possessions || possessions <= 0) {
    return null;
  }

  return Number(((points / possessions) * 100).toFixed(3));
}

function calculateFieldGoals(stats) {
  return {
    made: stats.twoPointsMade + stats.threePointsMade,
    attempted: stats.twoPointsAttempted + stats.threePointsAttempted
  };
}

function applyTeamRatings(totals, opponentTotals) {
  const possessions = calculateEstimatedPossessions(totals);
  const opponentPossessions = calculateEstimatedPossessions(opponentTotals);

  totals.offensiveRating = calculateRating(totals.points, possessions);
  totals.defensiveRating = calculateRating(opponentTotals.points, opponentPossessions);
  totals.netRating =
    totals.offensiveRating === null || totals.defensiveRating === null
      ? null
      : Number((totals.offensiveRating - totals.defensiveRating).toFixed(3));
}

function calculateGameScore(player) {
  const fieldGoals = calculateFieldGoals(player);

  return round3(
    player.points +
      0.4 * fieldGoals.made -
      0.7 * fieldGoals.attempted -
      0.4 * (player.freeThrowsAttempted - player.freeThrowsMade) +
      0.7 * player.offensiveRebounds +
      0.3 * player.defensiveRebounds +
      player.steals +
      0.7 * player.assists +
      0.7 * player.blocks -
      0.4 * player.personalFouls -
      player.turnovers
  );
}

function applyPlayerAdvancedStats(player, teamTotals, opponentTotals) {
  const fieldGoals = calculateFieldGoals(player);
  const teamFieldGoals = calculateFieldGoals(teamTotals);
  const opponentFieldGoals = calculateFieldGoals(opponentTotals);
  const teamPossessions = calculateEstimatedPossessions(teamTotals);
  const opponentPossessions = calculateEstimatedPossessions(opponentTotals);
  const playerPossessions =
    fieldGoals.attempted + 0.44 * player.freeThrowsAttempted + player.turnovers;
  const playerOffensivePossessions = playerPossessions - player.offensiveRebounds;
  const teamFloorMinutes = teamTotals.minutes / 5;
  const minutes = player.minutes;

  player.trueShootingPercentage = round3(
    scale(
      divide(player.points, 2 * (fieldGoals.attempted + 0.44 * player.freeThrowsAttempted)),
      100
    )
  );
  player.effectiveFieldGoalPercentage = round3(
    scale(divide(fieldGoals.made + 0.5 * player.threePointsMade, fieldGoals.attempted), 100)
  );
  player.threePointAttemptRate = round3(
    divide(player.threePointsAttempted, fieldGoals.attempted)
  );
  player.freeThrowRate = round3(divide(player.freeThrowsAttempted, fieldGoals.attempted));
  player.offensiveReboundPercentage = round3(
    scale(
      divide(
        player.offensiveRebounds * teamFloorMinutes,
        minutes * (teamTotals.offensiveRebounds + opponentTotals.defensiveRebounds)
      ),
      100
    )
  );
  player.defensiveReboundPercentage = round3(
    scale(
      divide(
        player.defensiveRebounds * teamFloorMinutes,
        minutes * (teamTotals.defensiveRebounds + opponentTotals.offensiveRebounds)
      ),
      100
    )
  );
  player.totalReboundPercentage = round3(
    scale(
      divide(player.rebounds * teamFloorMinutes, minutes * (teamTotals.rebounds + opponentTotals.rebounds)),
      100
    )
  );
  player.assistPercentage = round3(
    scale(
      divide(player.assists, (minutes / teamFloorMinutes) * teamFieldGoals.made - fieldGoals.made),
      100
    )
  );
  player.stealPercentage = round3(
    scale(divide(player.steals * teamFloorMinutes, minutes * opponentPossessions), 100)
  );
  player.blockPercentage = round3(
    scale(
      divide(
        player.blocks * teamFloorMinutes,
        minutes * (opponentFieldGoals.attempted - opponentTotals.threePointsAttempted)
      ),
      100
    )
  );
  player.turnoverPercentage = round3(scale(divide(player.turnovers, playerPossessions), 100));
  player.usagePercentage = round3(
    scale(
      divide(
        playerPossessions * teamFloorMinutes,
        minutes *
          (teamFieldGoals.attempted + 0.44 * teamTotals.freeThrowsAttempted + teamTotals.turnovers)
      ),
      100
    )
  );
  player.offensiveRating =
    player.offensiveRating ?? calculateRating(player.points, playerOffensivePossessions);
  player.defensiveRating = player.defensiveRating ?? calculateRating(opponentTotals.points, opponentPossessions);
  player.netRating =
    player.offensiveRating === null || player.defensiveRating === null
      ? null
      : round3(player.offensiveRating - player.defensiveRating);
  player.gameScore = calculateGameScore(player);
}

function applyPlayersAdvancedStats(players, teamTotals, opponentTotals) {
  for (const playerRow of players) {
    applyPlayerAdvancedStats(playerRow.player, teamTotals, opponentTotals);
  }
}

function parsePreciserInteger(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return Math.round(number);
}

function applyTeamScoringBreakdown(totals, breakdown) {
  if (!breakdown) {
    return;
  }

  totals.pointsInPaint = parsePreciserInteger(breakdown.pointsInPaint);
  totals.pointsFromSecondChance = parsePreciserInteger(breakdown.pointsFromSecondChance);
  totals.pointsFromFastbreak = parsePreciserInteger(breakdown.pointsFromFastbreak);
}

function toPlayerStatRow(gameId, teamId, playerId, player) {
  return {
    game_id: gameId,
    team_id: teamId,
    player_id: playerId,
    minutes: player.minutes,
    points: player.points,
    rebounds: player.rebounds,
    assists: player.assists,
    steals: player.steals,
    blocks: player.blocks,
    turnovers: player.turnovers,
    plus_minus: player.plusMinus,
    true_shooting_percentage: player.trueShootingPercentage,
    effective_field_goal_percentage: player.effectiveFieldGoalPercentage,
    three_point_attempt_rate: player.threePointAttemptRate,
    free_throw_rate: player.freeThrowRate,
    offensive_rebound_percentage: player.offensiveReboundPercentage,
    defensive_rebound_percentage: player.defensiveReboundPercentage,
    total_rebound_percentage: player.totalReboundPercentage,
    assist_percentage: player.assistPercentage,
    steal_percentage: player.stealPercentage,
    block_percentage: player.blockPercentage,
    turnover_percentage: player.turnoverPercentage,
    usage_percentage: player.usagePercentage,
    game_score: player.gameScore,
    starter: player.starter,
    two_points_made: player.twoPointsMade,
    two_points_attempted: player.twoPointsAttempted,
    two_points_percentage: player.twoPointsPercentage,
    three_points_made: player.threePointsMade,
    three_points_attempted: player.threePointsAttempted,
    three_points_percentage: player.threePointsPercentage,
    free_throws_made: player.freeThrowsMade,
    free_throws_attempted: player.freeThrowsAttempted,
    free_throws_percentage: player.freeThrowsPercentage,
    offensive_rebounds: player.offensiveRebounds,
    defensive_rebounds: player.defensiveRebounds,
    personal_fouls: player.personalFouls,
    efficiency: player.efficiency,
    assist_ratio: player.assistRatio,
    turnover_ratio: player.turnoverRatio,
    offensive_rating: player.offensiveRating,
    defensive_rating: player.defensiveRating,
    net_rating: player.netRating,
    offensive_possessions: player.offensivePossessions,
    opponent_offensive_possessions: player.opponentOffensivePossessions,
    opponent_points_from_second_chance: player.opponentPointsFromSecondChance,
    opponent_points_from_fastbreak: player.opponentPointsFromFastbreak,
    opponent_points_from_turnover: player.opponentPointsFromTurnover,
    opponent_points_in_paint: player.opponentPointsInPaint,
    pace: player.pace
  };
}

function toPlayerPeriodStatRow(gameId, teamId, playerId, period, player) {
  return {
    ...toPlayerStatRow(gameId, teamId, playerId, player),
    period
  };
}

function toPlayerHalfStatRow(gameId, teamId, playerId, half, player) {
  return {
    ...toPlayerStatRow(gameId, teamId, playerId, player),
    half
  };
}

function toTeamStatRow(gameId, teamId, totals) {
  return {
    game_id: gameId,
    team_id: teamId,
    points: totals.points,
    rebounds: totals.rebounds,
    assists: totals.assists,
    turnovers: totals.turnovers,
    local_points:
      totals.hasPlayerTypes && !totals.hasUnclassifiedPlayerPoints ? totals.localPoints : null,
    import_points:
      totals.hasPlayerTypes && !totals.hasUnclassifiedPlayerPoints ? totals.importPoints : null,
    fs_points: totals.hasPlayerTypes && !totals.hasUnclassifiedPlayerPoints ? totals.fsPoints : null,
    points_in_paint: totals.pointsInPaint,
    points_from_second_chance: totals.pointsFromSecondChance,
    points_from_fastbreak: totals.pointsFromFastbreak,
    offensive_rating: totals.offensiveRating,
    defensive_rating: totals.defensiveRating,
    net_rating: totals.netRating,
    steals: totals.steals,
    blocks: totals.blocks,
    offensive_rebounds: totals.offensiveRebounds,
    defensive_rebounds: totals.defensiveRebounds,
    personal_fouls: totals.personalFouls,
    efficiency: totals.efficiency,
    two_points_made: totals.twoPointsMade,
    two_points_attempted: totals.twoPointsAttempted,
    two_points_percentage: calculatePercentage(totals.twoPointsMade, totals.twoPointsAttempted),
    three_points_made: totals.threePointsMade,
    three_points_attempted: totals.threePointsAttempted,
    three_points_percentage: calculatePercentage(totals.threePointsMade, totals.threePointsAttempted),
    free_throws_made: totals.freeThrowsMade,
    free_throws_attempted: totals.freeThrowsAttempted,
    free_throws_percentage: calculatePercentage(totals.freeThrowsMade, totals.freeThrowsAttempted)
  };
}

function toTeamPeriodStatRow(gameId, teamId, period, totals) {
  return {
    ...toTeamStatRow(gameId, teamId, totals),
    period
  };
}

function toTeamHalfStatRow(gameId, teamId, half, totals) {
  return {
    ...toTeamStatRow(gameId, teamId, totals),
    half
  };
}

async function upsertRow(client, table, columns, conflictColumns, row) {
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
  const updateColumns = columns.filter((column) => !conflictColumns.includes(column));
  const updateSet = updateColumns.map((column) => `${column} = EXCLUDED.${column}`).join(",\n          ");

  await client.query(
    `
      INSERT INTO ${table} (${columns.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT (${conflictColumns.join(", ")})
      DO UPDATE
      SET ${updateSet}
    `,
    columns.map((column) => row[column])
  );
}

async function fetchBoxscore(externalGameId, tab = "total") {
  const url = `${BASE_URL}/api/boxscore.preciser.php?id=${encodeURIComponent(
    externalGameId
  )}&away_tab=${tab}&home_tab=${tab}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Boxscore request failed ${response.status}: ${url}`);
  }

  const payload = await response.json();

  if (payload.error) {
    throw new Error(`Boxscore API error for game ${externalGameId}: ${payload.error}`);
  }

  return payload.data;
}

async function fetchGamePage(externalGameId) {
  const url = `${BASE_URL}/game/${encodeURIComponent(externalGameId)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Game page request failed ${response.status}: ${url}`);
  }

  return response.text();
}

function extractPreciserGameId(html) {
  return (
    html.match(/postGameStatisticsBoard\.fetchData\(['"]([^'"]+)['"]\)/)?.[1] ||
    html.match(/preciserChart\.fetchChartData\(['"]([^'"]+)['"]\)/)?.[1] ||
    null
  );
}

function mapPreciserSummary(summary) {
  if (!summary) {
    return null;
  }

  return {
    away: {
      pointsInPaint: summary.paint_points?.away_value,
      pointsFromSecondChance: summary.second_chance_points?.away_value,
      pointsFromFastbreak: summary.fast_break_points?.away_value
    },
    home: {
      pointsInPaint: summary.paint_points?.home_value,
      pointsFromSecondChance: summary.second_chance_points?.home_value,
      pointsFromFastbreak: summary.fast_break_points?.home_value
    }
  };
}

async function fetchGameSummary(externalGameId) {
  const html = await fetchGamePage(externalGameId);
  const preciserGameId = extractPreciserGameId(html);

  if (!preciserGameId) {
    return null;
  }

  const url = `${PRECISER_API_BASE_URL}/post/game/summary/o/plg/gameId/${encodeURIComponent(
    preciserGameId
  )}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Preciser summary request failed ${response.status}: ${url}`);
  }

  const payload = await response.json();
  const summary = Array.isArray(payload) ? payload[0] : payload;

  return {
    preciserGameId,
    teams: mapPreciserSummary(summary)
  };
}

async function fetchPlayerType(randomId) {
  const url = `${BASE_URL}/player/${encodeURIComponent(randomId)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Player page request failed ${response.status}: ${url}`);
  }

  const html = await response.text();
  const match = html.match(/\u8eab\u4efd\uff1a\s*([^<\r\n]+)/);

  return normalizeOfficialPlayerType(match?.[1]);
}

async function getPlayerType(playerTypeCache, randomId) {
  if (!randomId) {
    return null;
  }

  if (playerTypeCache.has(randomId)) {
    return playerTypeCache.get(randomId);
  }

  if (PLAYER_TYPE_OVERRIDES.has(randomId)) {
    const playerType = PLAYER_TYPE_OVERRIDES.get(randomId);
    playerTypeCache.set(randomId, playerType);

    return playerType;
  }

  try {
    const playerType = await fetchPlayerType(randomId);
    playerTypeCache.set(randomId, playerType);

    return playerType;
  } catch (error) {
    console.warn(`Unable to fetch player type for ${randomId}: ${error.message}`);
    playerTypeCache.set(randomId, null);

    return null;
  }
}

function getBoxscorePlayers(data) {
  return [...(data.away || []), ...(data.home || [])];
}

async function preloadPlayerTypes(playerTypeCache, boxscoreDataList) {
  const randomIds = new Set();

  for (const data of boxscoreDataList) {
    for (const apiPlayer of getBoxscorePlayers(data)) {
      const randomId = nullableText(apiPlayer.random_id);

      if (randomId) {
        randomIds.add(randomId);
      }
    }
  }

  for (const randomId of randomIds) {
    await getPlayerType(playerTypeCache, randomId);
  }
}

function getCachedPlayerType(playerTypeCache, apiPlayer) {
  const randomId = nullableText(apiPlayer.random_id);

  if (!randomId || !playerTypeCache.has(randomId)) {
    return null;
  }

  return playerTypeCache.get(randomId);
}

async function loadFinalGames(client) {
  const { rows } = await client.query(`
    WITH team_stat_counts AS (
      SELECT game_id, COUNT(DISTINCT team_id) AS team_count
      FROM game_team_stats
      GROUP BY game_id
    )
    SELECT
      g.id,
      g.league_id,
      g.external_game_id,
      g.home_team_id,
      g.away_team_id,
      home.short_name AS home_team_short_name,
      away.short_name AS away_team_short_name
    FROM games g
    JOIN leagues l ON l.id = g.league_id
    JOIN teams home ON home.id = g.home_team_id
    JOIN teams away ON away.id = g.away_team_id
    LEFT JOIN team_stat_counts stats ON stats.game_id = g.id
    WHERE l.code = 'PLG'
      AND g.status = 'final'
      AND g.external_game_id IS NOT NULL
      AND ($1::boolean = false OR COALESCE(stats.team_count, 0) < 2)
    ORDER BY g.game_date, g.game_time, g.external_game_id
  `, [IMPORT_MISSING_ONLY]);

  return rows;
}

async function upsertPlayer(client, leagueId, teamId, player) {
  const { rows } = await client.query(
    `
      INSERT INTO players (
        league_id,
        team_id,
        name,
        player_type,
        position,
        official_player_id,
        person_id,
        random_id,
        english_name,
        jersey_number
      )
      VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9)
      ON CONFLICT (team_id, name)
      DO UPDATE
      SET name = EXCLUDED.name,
          player_type = COALESCE(EXCLUDED.player_type, players.player_type),
          official_player_id = COALESCE(EXCLUDED.official_player_id, players.official_player_id),
          person_id = COALESCE(EXCLUDED.person_id, players.person_id),
          random_id = COALESCE(EXCLUDED.random_id, players.random_id),
          english_name = COALESCE(EXCLUDED.english_name, players.english_name),
          jersey_number = COALESCE(EXCLUDED.jersey_number, players.jersey_number)
      RETURNING id, player_type
    `,
    [
      leagueId,
      teamId,
      player.name,
      player.playerType,
      player.officialPlayerId,
      player.personId,
      player.randomId,
      player.englishName,
      player.jerseyNumber
    ]
  );

  return rows[0];
}

async function upsertPlayerStats(client, gameId, teamId, playerId, player) {
  await upsertRow(client, "game_player_stats", PLAYER_STAT_COLUMNS, ["game_id", "player_id"], {
    ...toPlayerStatRow(gameId, teamId, playerId, player)
  });
}

async function upsertPlayerPeriodStats(client, gameId, teamId, playerId, period, player) {
  await upsertRow(
    client,
    "game_player_period_stats",
    PLAYER_PERIOD_STAT_COLUMNS,
    ["game_id", "player_id", "period"],
    toPlayerPeriodStatRow(gameId, teamId, playerId, period, player)
  );
}

async function upsertPlayerHalfStats(client, gameId, teamId, playerId, half, player) {
  await upsertRow(
    client,
    "game_player_half_stats",
    PLAYER_HALF_STAT_COLUMNS,
    ["game_id", "player_id", "half"],
    toPlayerHalfStatRow(gameId, teamId, playerId, half, player)
  );
}

async function upsertTeamStats(client, gameId, teamId, totals) {
  await upsertRow(client, "game_team_stats", TEAM_STAT_COLUMNS, ["game_id", "team_id"], {
    ...toTeamStatRow(gameId, teamId, totals)
  });
}

async function upsertTeamPeriodStats(client, gameId, teamId, period, totals) {
  await upsertRow(
    client,
    "game_team_period_stats",
    TEAM_PERIOD_STAT_COLUMNS,
    ["game_id", "team_id", "period"],
    toTeamPeriodStatRow(gameId, teamId, period, totals)
  );
}

async function upsertTeamHalfStats(client, gameId, teamId, half, totals) {
  await upsertRow(
    client,
    "game_team_half_stats",
    TEAM_HALF_STAT_COLUMNS,
    ["game_id", "team_id", "half"],
    toTeamHalfStatRow(gameId, teamId, half, totals)
  );
}

async function upsertPlayerRows(client, gameId, teamId, players) {
  for (const playerRow of players) {
    await upsertPlayerStats(client, gameId, teamId, playerRow.playerId, playerRow.player);
  }
}

async function upsertPlayerPeriodRows(client, gameId, teamId, period, players) {
  for (const playerRow of players) {
    await upsertPlayerPeriodStats(
      client,
      gameId,
      teamId,
      playerRow.playerId,
      period,
      playerRow.player
    );
  }
}

async function upsertPlayerHalfRows(client, gameId, teamId, half, players) {
  for (const playerRow of players) {
    await upsertPlayerHalfStats(
      client,
      gameId,
      teamId,
      playerRow.playerId,
      half,
      playerRow.player
    );
  }
}

async function importTeamTotal(client, game, teamId, apiPlayers, playerTypeCache) {
  const totals = emptyTeamTotals();
  const players = [];
  let importedPlayers = 0;

  for (const apiPlayer of apiPlayers) {
    const player = normalizePlayer(apiPlayer, getCachedPlayerType(playerTypeCache, apiPlayer));

    if (!player.name) {
      continue;
    }

    const dbPlayer = await upsertPlayer(client, game.league_id, teamId, player);
    addToTeamTotals(totals, player, dbPlayer.player_type);
    players.push({ playerId: dbPlayer.id, player });
    importedPlayers += 1;
  }

  return { importedPlayers, players, totals };
}

async function importTeamPeriod(client, game, teamId, period, apiPlayers, playerTypeCache) {
  const totals = emptyTeamTotals();
  const players = [];
  let importedPlayers = 0;

  for (const apiPlayer of apiPlayers) {
    const player = normalizePlayer(apiPlayer, getCachedPlayerType(playerTypeCache, apiPlayer));

    if (!player.name) {
      continue;
    }

    const dbPlayer = await upsertPlayer(client, game.league_id, teamId, player);
    addToTeamTotals(totals, player, dbPlayer.player_type);
    players.push({ playerId: dbPlayer.id, player });
    importedPlayers += 1;
  }

  return { importedPlayers, players, totals };
}

async function importTeamHalf(client, game, teamId, half, apiPlayers, playerTypeCache) {
  const totals = emptyTeamTotals();
  const players = [];
  let importedPlayers = 0;

  for (const apiPlayer of apiPlayers) {
    const player = normalizePlayer(apiPlayer, getCachedPlayerType(playerTypeCache, apiPlayer));

    if (!player.name) {
      continue;
    }

    const dbPlayer = await upsertPlayer(client, game.league_id, teamId, player);
    addToTeamTotals(totals, player, dbPlayer.player_type);
    players.push({ playerId: dbPlayer.id, player });
    importedPlayers += 1;
  }

  return { importedPlayers, players, totals };
}

async function importGame(client, game, playerTypeCache) {
  const totalData = await fetchBoxscore(game.external_game_id, "total");
  let gameSummary = null;
  const periodData = [];
  const halfData = [];

  try {
    gameSummary = await fetchGameSummary(game.external_game_id);
  } catch (error) {
    console.warn(
      `Unable to fetch PLG game summary for ${game.external_game_id}: ${error.message}`
    );
  }

  for (const period of PERIODS) {
    periodData.push({
      ...period,
      data: await fetchBoxscore(game.external_game_id, period.tab)
    });
  }

  for (const half of HALVES) {
    halfData.push({
      ...half,
      data: await fetchBoxscore(game.external_game_id, half.tab)
    });
  }

  await preloadPlayerTypes(playerTypeCache, [
    totalData,
    ...periodData.map((period) => period.data),
    ...halfData.map((half) => half.data)
  ]);

  await client.query("BEGIN");

  try {
    const awayTotal = await importTeamTotal(
      client,
      game,
      game.away_team_id,
      totalData.away || [],
      playerTypeCache
    );
    const homeTotal = await importTeamTotal(
      client,
      game,
      game.home_team_id,
      totalData.home || [],
      playerTypeCache
    );
    const periodSummaries = [];
    const halfSummaries = [];

    applyTeamRatings(awayTotal.totals, homeTotal.totals);
    applyTeamRatings(homeTotal.totals, awayTotal.totals);
    applyTeamScoringBreakdown(awayTotal.totals, gameSummary?.teams?.away);
    applyTeamScoringBreakdown(homeTotal.totals, gameSummary?.teams?.home);
    applyPlayersAdvancedStats(awayTotal.players, awayTotal.totals, homeTotal.totals);
    applyPlayersAdvancedStats(homeTotal.players, homeTotal.totals, awayTotal.totals);
    await upsertPlayerRows(client, game.id, game.away_team_id, awayTotal.players);
    await upsertPlayerRows(client, game.id, game.home_team_id, homeTotal.players);
    await upsertTeamStats(client, game.id, game.away_team_id, awayTotal.totals);
    await upsertTeamStats(client, game.id, game.home_team_id, homeTotal.totals);

    for (const period of periodData) {
      const awayPeriod = await importTeamPeriod(
        client,
        game,
        game.away_team_id,
        period.period,
        period.data.away || [],
        playerTypeCache
      );
      const homePeriod = await importTeamPeriod(
        client,
        game,
        game.home_team_id,
        period.period,
        period.data.home || [],
        playerTypeCache
      );

      applyTeamRatings(awayPeriod.totals, homePeriod.totals);
      applyTeamRatings(homePeriod.totals, awayPeriod.totals);
      applyPlayersAdvancedStats(awayPeriod.players, awayPeriod.totals, homePeriod.totals);
      applyPlayersAdvancedStats(homePeriod.players, homePeriod.totals, awayPeriod.totals);
      await upsertPlayerPeriodRows(
        client,
        game.id,
        game.away_team_id,
        period.period,
        awayPeriod.players
      );
      await upsertPlayerPeriodRows(
        client,
        game.id,
        game.home_team_id,
        period.period,
        homePeriod.players
      );
      await upsertTeamPeriodStats(client, game.id, game.away_team_id, period.period, awayPeriod.totals);
      await upsertTeamPeriodStats(client, game.id, game.home_team_id, period.period, homePeriod.totals);

      periodSummaries.push({
        period: period.period,
        awayPlayers: awayPeriod.importedPlayers,
        homePlayers: homePeriod.importedPlayers,
        awayTotals: awayPeriod.totals,
        homeTotals: homePeriod.totals
      });
    }

    for (const half of halfData) {
      const awayHalf = await importTeamHalf(
        client,
        game,
        game.away_team_id,
        half.half,
        half.data.away || [],
        playerTypeCache
      );
      const homeHalf = await importTeamHalf(
        client,
        game,
        game.home_team_id,
        half.half,
        half.data.home || [],
        playerTypeCache
      );

      applyTeamRatings(awayHalf.totals, homeHalf.totals);
      applyTeamRatings(homeHalf.totals, awayHalf.totals);
      applyPlayersAdvancedStats(awayHalf.players, awayHalf.totals, homeHalf.totals);
      applyPlayersAdvancedStats(homeHalf.players, homeHalf.totals, awayHalf.totals);
      await upsertPlayerHalfRows(client, game.id, game.away_team_id, half.half, awayHalf.players);
      await upsertPlayerHalfRows(client, game.id, game.home_team_id, half.half, homeHalf.players);
      await upsertTeamHalfStats(client, game.id, game.away_team_id, half.half, awayHalf.totals);
      await upsertTeamHalfStats(client, game.id, game.home_team_id, half.half, homeHalf.totals);

      halfSummaries.push({
        half: half.half,
        awayPlayers: awayHalf.importedPlayers,
        homePlayers: homeHalf.importedPlayers,
        awayTotals: awayHalf.totals,
        homeTotals: homeHalf.totals
      });
    }

    await client.query("COMMIT");

    return {
      externalGameId: game.external_game_id,
      preciserGameId: gameSummary?.preciserGameId || null,
      awayTeam: game.away_team_short_name,
      homeTeam: game.home_team_short_name,
      awayPlayers: awayTotal.importedPlayers,
      homePlayers: homeTotal.importedPlayers,
      awayTotals: awayTotal.totals,
      homeTotals: homeTotal.totals,
      periods: periodSummaries,
      halves: halfSummaries
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function run() {
  const client = await pool.connect();
  const playerTypeCache = new Map();
  const summary = {
    scrapedAt: new Date().toISOString(),
    writesToDatabase: true,
    missingOnly: IMPORT_MISSING_ONLY,
    importedGames: 0,
    skippedGames: [],
    importedPlayerStatRows: 0,
    importedPlayerPeriodStatRows: 0,
    importedPlayerHalfStatRows: 0,
    importedTeamStatRows: 0,
    importedTeamPeriodStatRows: 0,
    importedTeamHalfStatRows: 0,
    playerTypesCached: 0,
    mappedOfficialFields: MAPPED_OFFICIAL_FIELDS,
    unmappedOfficialFields: [],
    gameSummaries: []
  };

  try {
    const games = await loadFinalGames(client);

    for (const game of games) {
      const gameSummary = await importGame(client, game, playerTypeCache);

      summary.importedGames += 1;
      summary.importedPlayerStatRows += gameSummary.awayPlayers + gameSummary.homePlayers;
      summary.importedPlayerPeriodStatRows += gameSummary.periods.reduce(
        (sum, period) => sum + period.awayPlayers + period.homePlayers,
        0
      );
      summary.importedPlayerHalfStatRows += gameSummary.halves.reduce(
        (sum, half) => sum + half.awayPlayers + half.homePlayers,
        0
      );
      summary.importedTeamStatRows += 2;
      summary.importedTeamPeriodStatRows += gameSummary.periods.length * 2;
      summary.importedTeamHalfStatRows += gameSummary.halves.length * 2;
      summary.gameSummaries.push(gameSummary);
    }

    summary.playerTypesCached = Array.from(playerTypeCache.values()).filter(Boolean).length;

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

    console.log(`Imported games: ${summary.importedGames}`);
    console.log(`Imported player stat rows: ${summary.importedPlayerStatRows}`);
    console.log(`Imported player period stat rows: ${summary.importedPlayerPeriodStatRows}`);
    console.log(`Imported player half stat rows: ${summary.importedPlayerHalfStatRows}`);
    console.log(`Imported team stat rows: ${summary.importedTeamStatRows}`);
    console.log(`Imported team period stat rows: ${summary.importedTeamPeriodStatRows}`);
    console.log(`Imported team half stat rows: ${summary.importedTeamHalfStatRows}`);
    console.log(`Summary written: ${OUTPUT_PATH}`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
