const { logger } = require('../services/db');
const { AppError } = require('../utils/errors');

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    logger.error(`[ERROR] ${err.message}`, {
        requestId: req.id,
        stack: err.stack,
        details: err.details
    });

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Production: clean response
        res.status(err.statusCode).json({
            status: err.status,
            errorCode: err.errorCode || 'INTERNAL_ERROR',
            message: err.isOperational ? err.message : 'An unexpected error occurred'
        });
    }
};

module.exports = { asyncHandler, errorHandler };
