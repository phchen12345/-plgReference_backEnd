const { Router } = require("express");

const pool = require("../db/pool");
const asyncHandler = require("../middleware/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    await pool.query("SELECT 1");

    sendSuccess(res, {
      status: "ok",
      timestamp: new Date().toISOString()
    });
  })
);

module.exports = router;
