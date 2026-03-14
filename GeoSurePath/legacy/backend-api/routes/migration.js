const express = require('express');
const router = express.Router();
const { pool, logger } = require('../services/db');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/migrate', asyncHandler(async (req, res) => {
    const knexConfig = require('../knexfile');
    const knex = require('knex')(knexConfig[process.env.NODE_ENV || 'development']);
    await knex.migrate.latest();
    await knex.destroy();
    res.json({ success: true, message: 'Migrations executed.' });
}));

module.exports = router;
