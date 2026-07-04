const TradeContract = require('../models/TradeContract');
const EscrowService = require('../../../core/wallet/services/escrow.service');
const ComplianceService = require('../compliance/compliance.service');

class TradeService {
    static async initiateTrade(buyerId, sellerId, listingId, terms) {
        // 1. Compliance Gate: Are these entities allowed to trade this item?
        await ComplianceService.verifyTradeEligibility(buyerId, sellerId, listingId);

        // 2. Escrow Lock: Funds are locked in the Wallet/Settlement Core
        const escrow = await EscrowService.holdFunds(buyerId, terms.price, 'TRADE_ESCROW');

        // 3. Contract Generation: Create the immutable TradeContract
        const contract = await TradeContract.create({
            buyerId, sellerId, listingId, terms, 
            escrowId: escrow._id, 
            status: 'NEGOTIATION' 
        });

        return { contractId: contract._id, escrowStatus: 'LOCKED' };
    }
}
