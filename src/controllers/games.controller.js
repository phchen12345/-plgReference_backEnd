const asyncHandler = require("../middleware/asyncHandler");
const gamesService = require("../services/games.service");
const { sendSuccess } = require("../utils/apiResponse");

const listGames = asyncHandler(async (req, res) => {
  const games = await gamesService.listGames(req.query);
  sendSuccess(res, games);
});

const getGame = asyncHandler(async (req, res) => {
  const game = await gamesService.getGameById(req.params.id);
  sendSuccess(res, game);
});

const getGameBoxscore = asyncHandler(async (req, res) => {
  const boxscore = await gamesService.getGameBoxscoreById(req.params.id);
  sendSuccess(res, boxscore);
});

const createGame = asyncHandler(async (req, res) => {
  const game = await gamesService.createGame(req.body);
  sendSuccess(res, game, { statusCode: 201, message: "Game created" });
});

const updateGame = asyncHandler(async (req, res) => {
  const game = await gamesService.updateGame(req.params.id, req.body);
  sendSuccess(res, game, { message: "Game updated" });
});

const deleteGame = asyncHandler(async (req, res) => {
  await gamesService.deleteGame(req.params.id);
  res.status(204).send();
});

module.exports = {
  listGames,
  getGame,
  getGameBoxscore,
  createGame,
  updateGame,
  deleteGame
};
