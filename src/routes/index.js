const { Router } = require("express");

const analyticsRoutes = require("./analytics.routes");
const gamesRoutes = require("./games.routes");
const healthRoutes = require("./health.routes");
const scheduleRoutes = require("./schedule.routes");
const teamsRoutes = require("./teams.routes");

const router = Router();

router.use("/analytics", analyticsRoutes);
router.use("/health", healthRoutes);
router.use("/teams", teamsRoutes);
router.use("/games", gamesRoutes);
router.use("/schedule", scheduleRoutes);

module.exports = router;
