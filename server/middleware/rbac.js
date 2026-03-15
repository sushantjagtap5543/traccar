function permit(...allowedRoles) {
    return (req, res, next) => {
        const { role } = req.user;
        if (allowedRoles.includes(role)) next();
        else return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    };
}

module.exports = { permit };
