const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool, redisClient, logger } = require('../services/db');
const { asyncHandler } = require('../middleware/errorHandler');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const { bruteForceProtection } = require('../middleware/rateLimiter');
const { sendSMS } = require('../services/sms');
const bcrypt = require('bcryptjs');

const loginLimiter = bruteForceProtection('login', 5, 300); // 5 attempts per 5 mins
const otpLimiter = bruteForceProtection('otp', 3, 600); // 3 OTP requests per 10 mins

// --- OTP REGISTRATION ---

router.post('/register-otp', otpLimiter, asyncHandler(async (req, res) => {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in Redis with 5-minute TTL
    await redisClient.set(`otp:${mobile}`, otp, 'EX', 300);
    
    // Send SMS (Mocked)
    await sendSMS(mobile, `Your GeoSurePath verification code: ${otp}`);
    
    res.json({ success: true, message: 'OTP sent successfully' });
}));

router.post('/verify-otp', asyncHandler(async (req, res) => {
    const { mobile, otp, name, email, company, address, password } = req.body;
    
    const storedOtp = await redisClient.get(`otp:${mobile}`);
    if (!storedOtp || storedOtp !== otp) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || 'GeoSurePath123!', 12);

    // 1. Create Client for the user (Tenant)
    const clientResult = await pool.query(
        'INSERT INTO clients (name, email) VALUES ($1, $2) RETURNING id',
        [company || `${name}'s Company`, email]
    );
    const clientId = clientResult.rows[0].id;

    // 2. Create or update user
    const result = await pool.query(
        `INSERT INTO users (client_id, name, email, mobile, company, address, password, is_otp_verified) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE) 
         ON CONFLICT (mobile) DO UPDATE SET 
            client_id = EXCLUDED.client_id, name = EXCLUDED.name, email = EXCLUDED.email, company = EXCLUDED.company, address = EXCLUDED.address, is_otp_verified = TRUE 
         RETURNING id, name, email, mobile, role, client_id`,
        [clientId, name, email, mobile, company, address, hashedPassword]
    );

    const user = result.rows[0];
    
    // Generate JWTs
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // Cleanup OTP
    await redisClient.del(`otp:${mobile}`);

    res.json({ token, refreshToken, user });
}));

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.json({ token, refreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}));

module.exports = router;
