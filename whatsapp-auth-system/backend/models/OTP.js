const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  whatsapp_number: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expires_at: {
    type: Date,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('OTP', OTPSchema);
