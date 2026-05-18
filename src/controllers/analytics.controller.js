const analyticsService = require("../services/analytics.service");
const asyncHandler = require("../middleware/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const trackPageView = asyncHandler(async (req, res) => {
  const result = await analyticsService.trackPageView(req.body, {
    ip: req.ip,
    userAgent: req.get("user-agent")
  });

  sendSuccess(res, result, { statusCode: 201, message: "Page view tracked" });
});

const getSummary = asyncHandler(async (req, res) => {
  const summary = await analyticsService.getSummary(req.query);
  sendSuccess(res, summary);
});

module.exports = {
  getSummary,
  trackPageView
};
