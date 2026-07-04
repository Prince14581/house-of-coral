const RhythmContent = require('../models/content.model');
const WalletService = require('../../../core/wallet/services/wallet.service');

class RhythmService {
    static async processStreamListen(userId, contentId) {
        const content = await RhythmContent.findById(contentId);
        
        // 1. Trigger the $0.02 yield for the creator
        await WalletService.updateBalance(
            content.creatorId, 
            0.02, 
            'RHYTHM_LISTEN', 
            { contentId }
        );

        // 2. Automated Treasury Fee (5% of the royalty split)
        const platformFee = 0.02 * content.royaltySplit;
        await WalletService.updateBalance(
            content.creatorId, 
            -platformFee, 
            'RHYTHM_PLATFORM_FEE', 
            { contentId }
        );
    }
}
