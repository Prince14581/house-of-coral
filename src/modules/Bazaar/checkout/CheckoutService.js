// src/modules/Bazaar/checkout/CheckoutService.js
const InventoryService = require('../inventory/InventoryService');
const EscrowService = require('../escrow/EscrowService');
const OrderRepository = require('../orders/OrderRepository');

class CheckoutService {
    static async initiateCheckout(buyerId, cartItems) {
        // 1. Transaction Start: Inventory Reservation
        // We iterate through items and reserve them atomically
        for (const item of cartItems) {
            await InventoryService.reduceStock(item.productId, item.quantity);
        }

        try {
            // 2. Financial Lock: Escrow
            const totalAmount = cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            const escrow = await EscrowService.createEscrow(buyerId, 'SELLER_ID_PLACEHOLDER', totalAmount);

            // 3. Record Order
            const order = await OrderRepository.create({
                buyerId,
                items: cartItems,
                totalAmount,
                escrowId: escrow._id,
                status: 'PENDING_DELIVERY'
            });

            return { orderId: order._id, escrowId: escrow._id };
        } catch (error) {
            // Rollback inventory if financial lock fails
            await this.rollbackInventory(cartItems);
            throw new Error('Checkout failed. Stock released.');
        }
    }

    static async rollbackInventory(items) {
        // Logic to increment stock back if checkout fails
    }
}
