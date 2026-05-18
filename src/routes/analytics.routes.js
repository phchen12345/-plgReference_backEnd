const { Router } = require("express");
const { body, query } = require("express-validator");

const analyticsController = require("../controllers/analytics.controller");
const validate = require("../middleware/validate");

const router = Router();

router.post(
  "/page-view",
  [
    body("visitorId").optional({ nullable: true }).trim().isLength({ min: 8, max: 120 }),
    body("path").optional({ nullable: true }).trim().isLength({ max: 300 }),
    body("referrer").optional({ nullable: true }).trim().isLength({ max: 1000 })
  ],
  validate,
  analyticsController.trackPageView
);

router.get(
  "/summary",
  [
    query("from").optional().isISO8601(),
    query("to").optional().isISO8601(),
    query("path").optional().trim().isLength({ max: 300 }),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  analyticsController.getSummary
);

module.exports = router;
