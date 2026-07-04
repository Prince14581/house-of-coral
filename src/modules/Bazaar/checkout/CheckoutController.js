// src/modules/Bazaar/checkout/CheckoutController.js
const CheckoutService = require('./CheckoutService');

exports.processCheckout = async (req, res) => {
    const { items } = req.body;
    try {
        const result = await CheckoutService.initiateCheckout(req.user.id, items);
        res.status(200).json({ message: 'Checkout successful', ...result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
