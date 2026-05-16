const { Router } = require("express");
const { query } = require("express-validator");

const gamesController = require("../controllers/games.controller");
const validate = require("../middleware/validate");

const router = Router();
const statuses = ["scheduled", "live", "final", "postponed", "cancelled"];
const stages = ["preseason", "regular_season", "playoffs", "finals"];

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
    query("limit").optional().isInt({ min: 1, max: 200 }).toInt(),
    query("offset").optional().isInt({ min: 0 }).toInt()
  ],
  validate,
  gamesController.listGames
);

module.exports = router;
