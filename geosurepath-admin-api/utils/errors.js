/**
 * Custom Error Class for GeoSurePath
 * Ensures consistent error structure across the API.
 */
class AppError extends Error {
  constructor(code, message, statusCode = 500, details = {}) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

const createError = (code, message, statusCode, details) => {
  return new AppError(code, message, statusCode, details);
};

module.exports = { AppError, createError };
