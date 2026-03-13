const { AppError } = require('../utils/errors');
const { logger } = require('../services/db');

/**
 * Global Error Handler Middleware
 * Catches all errors and returns a sanitized JSON response.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // 1. Log the error for internal audit
  logger.error('API Error:', {
    code,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    requestId: req.headers['x-request-id']
  });

  // 2. Sanitize for production
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    message = 'An unexpected server error occurred. Please contact support.';
    code = 'INTERNAL_ERROR';
  }

  // 3. Send structured response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      ...(err.details && { details: err.details })
    }
  });
};

/**
 * Async Wrapper (BUG-004 Fix)
 * Catches errors in async routes and passes them to the global error handler.
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = { errorHandler, asyncHandler };
