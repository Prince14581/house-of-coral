const Inventory = require('../models/Inventory');

class InventoryRepository {
    async getStock(productId) {
        return await Inventory.findOne({ productId });
    }

    // Atomic decrement to prevent overselling
    async reserve(productId, quantity) {
        return await Inventory.findOneAndUpdate(
            { productId, quantity: { $gte: quantity } },
            { $inc: { quantity: -quantity } },
            { new: true }
        );
    }

    async release(productId, quantity) {
        return await Inventory.findOneAndUpdate(
            { productId },
            { $inc: { quantity: quantity } },
            { new: true }
        );
    }
}
module.exports = new InventoryRepository();
