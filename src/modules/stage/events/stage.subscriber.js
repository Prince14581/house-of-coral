const { stageEvents } = require('../services/stage.service');
const WalletService = require('../../../core/wallet/services/wallet.service');

// When a gift is sent, the Stage module processes it
stageEvents.on('GIFT_RECEIVED', async (data) => {
    // 1. Credit the wallet
    await WalletService.updateBalance(data.creatorId, data.value, 'STAGE_GIFT', { streamId: data.streamId });
    
    // 2. Trigger Treasury Fee (5% to Platform Treasury Node)
    const fee = data.value * 0.05;
    await WalletService.updateBalance(data.creatorId, -fee, 'PLATFORM_FEE', { streamId: data.streamId });
});
