const OrderService = require('../services/order.service');
const { validatePlaceOrder } = require('../validators/order.validator');
const { GovernanceService } = require('../../../core/governance/services/governance.service');

exports.placeOrder = async (req, res) => {
    try {
        // 1. Governance check
        await GovernanceService.validateAction(req.user.id, 'PLACE_ORDER');

        // 2. Validate input
        const { error } = validatePlaceOrder(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        // 3. Delegate to Service
        const order = await OrderService.placeOrder(req.user.id, req.body.items);
        
        res.status(201).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
