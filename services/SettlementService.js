// services/SettlementService.js
const TreasuryService = require('./TreasuryService');
const MatchHistory = require('../models/MatchHistory');

class SettlementService {
    /**
     * Finalizes the match result and triggers financial distribution
     * @param {string} matchId 
     */
    static async settleMatch(matchId) {
        const match = await MatchHistory.findOne({ matchId });

        // 1. Security check: Ensure the match wasn't flagged for tampering
        if (match.isFlagged) {
            throw new Error('Cannot settle flagged match: Manual review required.');
        }

        const winner = match.players.find(p => p.result === 'WIN');
        const loser = match.players.find(p => p.result === 'LOSS');

        // 2. Define payout logic (Assuming a pot-based system)
        const potAmount = 100; // Example: Fixed pot from entry fees
        
        // 3. Trigger TreasuryService to process payout
        // The TreasuryService handles the 10% fee calculation internally
        const settlement = await TreasuryService.processTransaction({
            sender: loser.userId,
            receiver: winner.userId,
            amount: potAmount,
            type: 'Arena_Payout'
        });

        return { success: true, settlement };
    }
}

module.exports = SettlementService;
