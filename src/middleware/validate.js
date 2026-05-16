const { validationResult } = require("express-validator");

const AppError = require("../errors/AppError");

function validate(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return next(new AppError("Validation failed", 400, result.array()));
}

module.exports = validate;
