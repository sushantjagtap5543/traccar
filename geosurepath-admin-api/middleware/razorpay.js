const crypto = require('crypto');
const { logger } = require('../services/db');

/**
 * Middleware to verify Razorpay webhook signatures
 * Prevents unauthorized webhook calls and payment fraud
 */
const verifyRazorpaySignature = (req, res, next) => {
    const signature = req.headers['x-razorpay-signature'];
    
    if (!signature) {
        logger.error('Razorpay webhook: Missing signature header');
        return res.status(400).json({ 
            error: 'Missing signature',
            code: 'SIGNATURE_REQUIRED'
        });
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        logger.error('FATAL: RAZORPAY_WEBHOOK_SECRET not configured');
        return res.status(500).json({ 
            error: 'Server configuration error',
            code: 'WEBHOOK_SECRET_NOT_CONFIGURED'
        });
    }

    // Razorpay sends raw body usually, but in Express with json parser it's req.body
    // For signature verification we need the exact string payload
    const payload = JSON.stringify(req.body);
    
    // Generate expected signature
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');
    
    // Constant-time comparison to prevent timing attacks
    // We use timingSafeEqual but need to ensure buffers have same length or handle it
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    
    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
        logger.error('Razorpay webhook: Invalid signature');
        return res.status(401).json({ 
            error: 'Invalid signature',
            code: 'INVALID_SIGNATURE'
        });
    }
    
    logger.info('Razorpay webhook: Signature verified successfully');
    next();
};

module.exports = { verifyRazorpaySignature };
