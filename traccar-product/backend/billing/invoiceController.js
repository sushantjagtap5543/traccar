const express = require('express');
const router = express.Router();

router.post('/generate', (req, res) => {
  const { userId, planId, amount } = req.body;
  res.json({
    invoiceId: `INV-${Date.now()}`,
    userId,
    amount,
    status: 'unpaid',
    createdAt: new Date()
  });
});

module.exports = router;
