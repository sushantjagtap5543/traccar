const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date(), uptime: process.uptime() });
});

router.get('/status', (req, res) => {
  res.json({ 
    service: 'traccar-product-backend',
    version: '1.0.0',
    db: 'connected',
    traccar_link: 'active'
  });
});

module.exports = router;
