const WalletService = require('../../wallet/services/wallet.service');

class EscrowEngine {
    static async holdFunds(userId, amount, referenceId) {
        // Move funds from User Wallet to "Escrow" (a virtual holding account)
        await WalletService.updateBalance(userId, -amount, 'ESCROW_HOLD', { referenceId });
        return { status: 'HELD', referenceId };
    }

    static async releaseFunds(sellerId, amount, referenceId) {
        // Release from Escrow to Seller
        await WalletService.updateBalance(sellerId, amount, 'ESCROW_RELEASE', { referenceId });
    }
}
module.exports = EscrowEngine;
