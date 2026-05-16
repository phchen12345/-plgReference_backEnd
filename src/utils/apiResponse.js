function sendSuccess(res, data, options = {}) {
  const statusCode = options.statusCode || 200;
  const response = {
    success: true,
    code: statusCode,
    message: options.message || "請求成功",
    data
  };

  return res.status(statusCode).json(response);
}

module.exports = {
  sendSuccess
};
