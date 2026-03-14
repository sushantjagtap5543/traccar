const { AppError } = require('../utils/errors');

const tenantIsolation = (req, res, next) => {
    // If user is admin, allow all access
    if (req.user && req.user.role === 'admin') {
        return next();
    }

    // Ensure user is restricted and has a client identity
    if (!req.traccarUser || !req.traccarUser.id) {
        return next(new AppError('FORBIDDEN', 'User not associated with a tracking client', 403));
    }

    next();
};

module.exports = { tenantIsolation };
