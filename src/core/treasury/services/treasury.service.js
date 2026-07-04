const eventBus = require('../../../shared/events/event.bus');

// The Treasury logs every fee automatically
eventBus.on('WALLET_CREDIT', (data) => {
    if (data.reason === 'PLATFORM_FEE') {
        console.log(`[Treasury] Fee Captured: ${data.amount} from ${data.userId}`);
        // Here you would also update your Treasury MongoDB collection
    }
});
