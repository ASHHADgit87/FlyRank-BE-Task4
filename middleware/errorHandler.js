const { errorResponse } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  const statusCode =
    err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${err.message}`);
  return errorResponse(res, statusCode, err.message || "Internal Server Error");
};

module.exports = errorHandler;
