function errorHandler(err, req, res, next) {
  const databaseError = mapDatabaseError(err);
  const statusCode = err.statusCode || databaseError.statusCode || 500;
  const response = {
    success: false,
    code: statusCode,
    error: {
      message: statusCode === 500 ? "Internal server error" : databaseError.message || err.message
    }
  };

  if (err.details) {
    response.error.details = err.details;
  }

  if (process.env.NODE_ENV !== "production" && statusCode === 500) {
    response.error.message = err.message;
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;

function mapDatabaseError(err) {
  switch (err.code) {
    case "23505":
      return { statusCode: 409, message: "Resource already exists" };
    case "23503":
      return { statusCode: 400, message: "Related record not found" };
    case "23514":
      return { statusCode: 400, message: "Invalid data for database constraints" };
    default:
      return {};
  }
}
