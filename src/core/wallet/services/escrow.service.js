const WalletService = require('./wallet.service');
const LedgerEngine = require('../../ledger/services/ledger.service');

class EscrowService {
    static async holdFunds(buyerId, amount, contractId) {
        // 1. Debit buyer wallet and move to 'ESCROW' system state
        await WalletService.debit(buyerId, amount);
        
        // 2. Log entry in Ledger as 'ESCROW_HOLD'
        await LedgerEngine.recordTransaction({
            type: 'ESCROW_HOLD',
            from: buyerId,
            to: 'PLATFORM_ESCROW_NODE',
            amount,
            contractId
        });
        
        return { status: 'LOCKED', contractId };
    }
}
module.exports = EscrowService;
