const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'ReplaceWithStrongSecret';

function generateToken(user) {
    return jwt.sign({ id: user.id || user._id, role: user.role }, SECRET_KEY, { expiresIn: '8h' });
}

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });
        req.user = decoded;
        next();
    });
}

module.exports = { generateToken, verifyToken };
