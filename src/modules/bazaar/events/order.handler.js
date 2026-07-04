const eventBus = require('../../../shared/events/event.bus');
const OrderRepository = require('../repositories/order.repository');

eventBus.on('PAYMENT_FAILED', async (data) => {
    console.log(`[Bazaar] Payment failed for order ${data.orderId}. Cancelling...`);
    await OrderRepository.updateStatus(data.orderId, 'CANCELLED');
});
