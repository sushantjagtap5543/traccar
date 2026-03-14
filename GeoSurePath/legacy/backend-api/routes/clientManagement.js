const express = require('express');
const router = express.Router();
const { pool, logger } = require('../services/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// --- CLIENT MANAGEMENT (ADMIN ONLY) ---

// List all clients/users
router.get('/', authenticateToken, isAdmin, asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT id, name, email, mobile, company, role, is_otp_verified, created_at FROM users WHERE role != \'admin\' ORDER BY created_at DESC');
    res.json(result.rows);
}));

// Create a new client
router.post('/', authenticateToken, isAdmin, asyncHandler(async (req, res) => {
    const { name, email, mobile, company, address, password, role } = req.body;
    
    // Hash password if provided, otherwise random one for OTP flow
    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
    
    const result = await pool.query(
        'INSERT INTO users (name, email, mobile, company, address, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, mobile',
        [name, email, mobile, company, address, hashedPassword, role || 'user']
    );
    
    res.status(201).json(result.rows[0]);
}));

// Get specific client details
router.get('/:id', authenticateToken, isAdmin, asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT id, name, email, mobile, company, address, role, is_otp_verified, created_at FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
}));

// Update client
router.put('/:id', authenticateToken, isAdmin, asyncHandler(async (req, res) => {
    const { name, company, address, role, status } = req.body;
    const result = await pool.query(
        'UPDATE users SET name = COALESCE($1, name), company = COALESCE($2, company), address = COALESCE($3, address), role = COALESCE($4, role) WHERE id = $5 RETURNING id, name',
        [name, company, address, role, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
}));

// Delete client
router.delete('/:id', authenticateToken, isAdmin, asyncHandler(async (req, res) => {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
}));

module.exports = router;
