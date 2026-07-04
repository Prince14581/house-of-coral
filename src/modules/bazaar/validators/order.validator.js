const Joi = require('joi');

const placeOrderSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            productId: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required()
        })
    ).min(1).required(),
    shippingAddress: Joi.string().required()
});

exports.validatePlaceOrder = (data) => placeOrderSchema.validate(data);
