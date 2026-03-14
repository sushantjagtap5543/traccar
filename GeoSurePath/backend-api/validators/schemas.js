const Joi = require('joi');

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const registerSuccessSchema = Joi.object({
    userId: Joi.number().required(),
    company: Joi.string().allow('', null),
    address: Joi.string().allow('', null)
});

const deviceSchema = Joi.object({
    name: Joi.string().required(),
    uniqueId: Joi.string().required(),
    phone: Joi.string().allow('', null),
    model: Joi.string().allow('', null),
    contact: Joi.string().allow('', null),
    category: Joi.string().allow('', null),
    attributes: Joi.object().unknown(true)
});

module.exports = {
    loginSchema,
    registerSuccessSchema,
    deviceSchema
};
