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

    // Migration Schemas
    cloudMigrate: Joi.object({
        host: Joi.string().required(),
        port: Joi.number().integer().min(1).max(65535).default(22),
        username: Joi.string().required(),
        password: Joi.string().allow('', null).optional(),
        privateKey: Joi.string().allow('', null).optional(),
        targetDir: Joi.string().required()
    }),

    // Backup & Settings
    backupConfig: Joi.object({
        googleDriveClientId: Joi.string().optional(),
        googleDriveClientSecret: Joi.string().optional(),
        googleDriveRefreshToken: Joi.string().optional(),
        encryptionKey: Joi.string().length(64).optional(),
        frequency: Joi.string().valid('daily', 'weekly', 'monthly').optional()
    }),

    settingsMaintenance: Joi.object({
        enabled: Joi.boolean().required()
    }),

    alertRules: Joi.object({
        config: Joi.object().required()
    }),

    alertConfig: Joi.object({
        webhookUrl: Joi.string().uri().required()
    }),

    // Reporting Schemas
    reportFilter: Joi.object({
        deviceId: Joi.number().integer().optional(),
        from: Joi.date().iso().required(),
        to: Joi.date().iso().required()
    })
};

module.exports = schemas;
