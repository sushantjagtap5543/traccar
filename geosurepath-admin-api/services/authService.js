const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { pool, redisClient, logger } = require('./db');

/**
 * Auth Service for GeoSurePath
 * Implements Access/Refresh token pattern and TOTP security.
 */

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      role: user.role || 'user',
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId: user.id, tokenId: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
  
  return { accessToken, refreshToken };
};

const generateTOTPSecret = async (user) => {
  const secret = speakeasy.generateSecret({
    name: `GeoSurePath (${user.email})`,
    issuer: 'GeoSurePath'
  });
  
  // Store secret in database for persistence (Production Standard)
  await pool.query(
    'UPDATE tc_users SET totp_secret = $1 WHERE email = $2',
    [secret.base32, user.email]
  );
  
  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
  
  return {
    secret: secret.base32,
    qrCode: qrCodeUrl
  };
};

const verifyTOTPToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time steps before/after for clock drift
  });
};

const blacklistToken = async (token, expiresIn = 900) => {
    try {
        await redisClient.set(`blacklist:${token}`, '1', { EX: expiresIn });
    } catch (err) {
        logger.error('Failed to blacklist token:', err.message);
    }
};

const isTokenBlacklisted = async (token) => {
    try {
        const blacklisted = await redisClient.get(`blacklist:${token}`);
        return !!blacklisted;
    } catch (err) {
        logger.error('Blacklist check failed:', err.message);
        return false;
    }
};

module.exports = {
    generateTokens,
    generateTOTPSecret,
    verifyTOTPToken,
    blacklistToken,
    isTokenBlacklisted
};
