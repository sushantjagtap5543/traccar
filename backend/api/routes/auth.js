const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool, redisClient, logger } = require('../services/db');
const { asyncHandler } = require('../middleware/errorHandler');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    // Mock login for now, but verify against tc_users
    const result = await pool.query("SELECT * FROM tc_users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.administrator ? 'admin' : 'user' }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.json({ token, refreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.administrator ? 'admin' : 'user' } });
}));

router.post('/register-success', asyncHandler(async (req, res) => {
    const { userId, company, address } = req.body;
    
    await pool.query(
        "INSERT INTO geosurepath_user_metadata (user_id, company_name, address) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET company_name = EXCLUDED.company_name, address = EXCLUDED.address",
        [userId, company, address]
    );

    res.json({ success: true });
}));

module.exports = router;
