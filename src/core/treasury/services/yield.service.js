const WalletService = require('../wallet/services/wallet.service');

class YieldService {
    /**
     * Calculates the $0.02 yield per transaction unit.
     */
    static async processActivityYield(userId, activityType, volume) {
        const YIELD_RATE = 0.02;
        const yieldAmount = volume * YIELD_RATE;

        // Apply the yield to the user's wallet
        await WalletService.updateBalance(
            userId, 
            yieldAmount, 
            'TREASURY_YIELD', 
            { activityType, volume }
        );
        
        return yieldAmount;
    }
}
module.exports = YieldService;
