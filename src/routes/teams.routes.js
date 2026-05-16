const { Router } = require("express");
const { body, param, query } = require("express-validator");

const teamsController = require("../controllers/teams.controller");
const validate = require("../middleware/validate");

const router = Router();

function isLogoUrl(value) {
  if (value === null || value === undefined || value === "") {
    return true;
  }

  if (/^\/[^\s]*$/.test(value)) {
    return true;
  }

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch (error) {
    return false;
  }
}

const teamBodyValidation = [
  body("leagueId").isInt({ min: 1 }).toInt(),
  body("name").trim().isLength({ min: 1, max: 120 }),
  body("shortName").optional({ nullable: true }).trim().isLength({ max: 60 }),
  body("logoUrl").optional({ nullable: true }).custom(isLogoUrl)
];

const optionalTeamBodyValidation = [
  body("leagueId").optional().isInt({ min: 1 }).toInt(),
  body("name").optional().trim().isLength({ min: 1, max: 120 }),
  body("shortName").optional({ nullable: true }).trim().isLength({ max: 60 }),
  body("logoUrl").optional({ nullable: true }).custom(isLogoUrl)
];

router.get(
  "/",
  [
    query("leagueId").optional().isInt({ min: 1 }).toInt(),
    query("leagueCode").optional().trim().isLength({ max: 40 }),
    query("q").optional().trim().isLength({ max: 120 }),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("offset").optional().isInt({ min: 0 }).toInt()
  ],
  validate,
  teamsController.listTeams
);

router.get("/:id", [param("id").isInt({ min: 1 }).toInt()], validate, teamsController.getTeam);

router.post("/", teamBodyValidation, validate, teamsController.createTeam);

router.patch(
  "/:id",
  [param("id").isInt({ min: 1 }).toInt(), ...optionalTeamBodyValidation],
  validate,
  teamsController.updateTeam
);

router.delete("/:id", [param("id").isInt({ min: 1 }).toInt()], validate, teamsController.deleteTeam);

module.exports = router;
