const Joi = require('joi');

/**
 * Universal Validation Middleware
 * Returns 400 with a structured error object if validation fails.
 * Strips unknown fields to prevent over-posting attacks.
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const details = error.details.map(d => ({
                field: d.path.join('.'),
                message: d.message
            }));
            
            return res.status(400).json({
                error: 'VALIDATION_ERROR',
                message: 'Invalid input data',
                details
            });
        }

        // Replace request data with sanitized/validated results
        req[property] = value;
        next();
    };
};

module.exports = validate;
