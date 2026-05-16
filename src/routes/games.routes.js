const { Router } = require("express");
const { body, param, query } = require("express-validator");

const gamesController = require("../controllers/games.controller");
const validate = require("../middleware/validate");

const router = Router();
const statuses = ["scheduled", "live", "final", "postponed", "cancelled"];
const stages = ["preseason", "regular_season", "playoffs", "finals"];

const gameBodyValidation = [
  body("leagueId").isInt({ min: 1 }).toInt(),
  body("seasonId").isInt({ min: 1 }).toInt(),
  body("externalGameId").optional({ nullable: true }).trim().isLength({ max: 80 }),
  body("gameCode").optional({ nullable: true }).trim().isLength({ max: 40 }),
  body("gameDate").isISO8601({ strict: true }),
  body("gameTime")
    .optional({ nullable: true })
    .matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
  body("venue").optional({ nullable: true }).trim().isLength({ max: 160 }),
  body("attendance").optional({ nullable: true }).isInt({ min: 0 }).toInt(),
  body("capacity").optional({ nullable: true }).isInt({ min: 0 }).toInt(),
  body("homeTeamId").isInt({ min: 1 }).toInt(),
  body("awayTeamId").isInt({ min: 1 }).toInt(),
  body("stage").optional().isIn(stages),
  body("homeScore").optional({ nullable: true }).isInt({ min: 0 }).toInt(),
  body("awayScore").optional({ nullable: true }).isInt({ min: 0 }).toInt(),
  body("status").optional().isIn(statuses)
];

const optionalGameBodyValidation = [
  body("leagueId").optional().isInt({ min: 1 }).toInt(),
  body("seasonId").optional().isInt({ min: 1 }).toInt(),
  body("externalGameId").optional({ nullable: true }).trim().isLength({ max: 80 }),
  body("gameCode").optional({ nullable: true }).trim().isLength({ max: 40 }),
  body("gameDate").optional().isISO8601({ strict: true }),
  body("gameTime")
    .optional({ nullable: true })
    .matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
  body("venue").optional({ nullable: true }).trim().isLength({ max: 160 }),
  body("attendance").optional({ nullable: true }).isInt({ min: 0 }).toInt(),
  body("capacity").optional({ nullable: true }).isInt({ min: 0 }).toInt(),
  body("homeTeamId").optional().isInt({ min: 1 }).toInt(),
  body("awayTeamId").optional().isInt({ min: 1 }).toInt(),
  body("stage").optional().isIn(stages),
  body("homeScore").optional({ nullable: true }).isInt({ min: 0 }).toInt(),
  body("awayScore").optional({ nullable: true }).isInt({ min: 0 }).toInt(),
  body("status").optional().isIn(statuses)
];

router.get(
  "/",
  [
    query("leagueId").optional().isInt({ min: 1 }).toInt(),
    query("leagueCode").optional().trim().isLength({ max: 40 }),
    query("seasonId").optional().isInt({ min: 1 }).toInt(),
    query("season").optional().trim().isLength({ max: 50 }),
    query("stage").optional().isIn(stages),
    query("status").optional().isIn(statuses),
    query("teamId").optional().isInt({ min: 1 }).toInt(),
    query("from").optional().isISO8601({ strict: true }),
    query("to").optional().isISO8601({ strict: true }),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("offset").optional().isInt({ min: 0 }).toInt()
  ],
  validate,
  gamesController.listGames
);

router.get(
  "/:id/boxscore",
  [param("id").isInt({ min: 1 }).toInt()],
  validate,
  gamesController.getGameBoxscore
);

router.get("/:id", [param("id").isInt({ min: 1 }).toInt()], validate, gamesController.getGame);

router.post("/", gameBodyValidation, validate, gamesController.createGame);

router.patch(
  "/:id",
  [param("id").isInt({ min: 1 }).toInt(), ...optionalGameBodyValidation],
  validate,
  gamesController.updateGame
);

router.delete("/:id", [param("id").isInt({ min: 1 }).toInt()], validate, gamesController.deleteGame);

module.exports = router;
