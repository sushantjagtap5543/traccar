const Joi = require('joi');

/**
 * Enterprise Schema Registry for GeoSurePath
 */
const schemas = {
    // Device Schemas
    createDevice: Joi.object({
        name: Joi.string().min(1).max(255).required(),
        uniqueId: Joi.string().min(1).max(50).required(),
        phone: Joi.string().allow('', null).optional(),
        model: Joi.string().allow('', null).optional(),
        contact: Joi.string().allow('', null).optional(),
        category: Joi.string().allow('', null).optional(),
        disabled: Joi.boolean().optional(),
        attributes: Joi.object().optional()
    }).unknown(true),

    bulkAction: Joi.object({
        ids: Joi.array().items(Joi.number().integer()).min(1).required(),
        updates: Joi.object().optional()
    }),

    // Auth Schemas
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        totpToken: Joi.string().length(6).optional()
    }),

    // Reporting Schemas
    reportFilter: Joi.object({
        deviceId: Joi.number().integer().optional(),
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().optional(),
        type: Joi.string().optional()
    })
};

module.exports = schemas;
