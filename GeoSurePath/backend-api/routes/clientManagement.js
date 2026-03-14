const express = require('express');
const router = express.Router();
const { pool, logger } = require('../services/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateJWT, adminAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// --- CLIENT MANAGEMENT (ADMIN ONLY) ---

// --- CLIENT (TENANT) MANAGEMENT ---

// List all clients
router.get('/tenants', authenticateJWT, adminAuth, asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
    res.json(result.rows);
}));

// Create a new client (Tenant)
router.post('/tenants', authenticateJWT, adminAuth, asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    const result = await pool.query(
        'INSERT INTO clients (name, email) VALUES ($1, $2) RETURNING *',
        [name, email]
    );
    res.status(201).json(result.rows[0]);
}));

// --- USER MANAGEMENT ---

// List all users with client info
router.get('/users', authenticateJWT, adminAuth, asyncHandler(async (req, res) => {
    const result = await pool.query(`
        SELECT u.id, u.name, u.email, u.mobile, u.role, c.name as client_name, u.created_at 
        FROM users u 
        LEFT JOIN clients c ON u.client_id = c.id 
        WHERE u.role != 'admin' 
        ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
}));

// Create a new user linked to a client
router.post('/users', authenticateJWT, adminAuth, asyncHandler(async (req, res) => {
    const { name, email, mobile, password, clientId, role } = req.body;
    const hashedPassword = await bcrypt.hash(password || 'GeoSurePath123!', 12);
    
    const result = await pool.query(
        'INSERT INTO users (name, email, mobile, password, client_id, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, client_id',
        [name, email, mobile, hashedPassword, clientId, role || 'user']
    );
    res.status(201).json(result.rows[0]);
}));

// Delete client (And cascade delete users/vehicles)
router.delete('/tenants/:id', authenticateJWT, adminAuth, asyncHandler(async (req, res) => {
    await pool.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    res.json({ message: 'Client and all associated data deleted' });
}));

module.exports = router;
