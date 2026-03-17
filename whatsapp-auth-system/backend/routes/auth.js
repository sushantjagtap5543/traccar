const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const {
  requestOTP,
  verifyOTP,
  register,
  login,
  getMe,
} = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/send-otp', requestOTP);
router.post('/verify-otp', verifyOTP);

router.post(
  '/register',
  [
    check('full_name', 'Full Name is required').not().isEmpty(),
    check('whatsapp_number', 'WhatsApp number is required').not().isEmpty(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  register
);

router.post('/login', login);

router.get('/me', auth, getMe);

module.exports = router;
