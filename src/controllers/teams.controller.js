const asyncHandler = require("../middleware/asyncHandler");
const teamsService = require("../services/teams.service");
const { sendSuccess } = require("../utils/apiResponse");

const listTeams = asyncHandler(async (req, res) => {
  const teams = await teamsService.listTeams(req.query);
  sendSuccess(res, teams);
});

const getTeam = asyncHandler(async (req, res) => {
  const team = await teamsService.getTeamById(req.params.id);
  sendSuccess(res, team);
});

const createTeam = asyncHandler(async (req, res) => {
  const team = await teamsService.createTeam(req.body);
  sendSuccess(res, team, { statusCode: 201, message: "Team created" });
});

const updateTeam = asyncHandler(async (req, res) => {
  const team = await teamsService.updateTeam(req.params.id, req.body);
  sendSuccess(res, team, { message: "Team updated" });
});

const deleteTeam = asyncHandler(async (req, res) => {
  await teamsService.deleteTeam(req.params.id);
  res.status(204).send();
});

module.exports = {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam
};
