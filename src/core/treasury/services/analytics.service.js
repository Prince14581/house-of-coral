const LedgerEntry = require('../../ledger/models/ledgerEntry.model');

class TreasuryAnalytics {
    static async getRealTimeStats() {
        const stats = await LedgerEntry.aggregate([
            { $match: { type: 'CREDIT', pillar: { $in: ['PLATFORM_FEE', 'TREASURY_YIELD'] } } },
            { 
                $group: {
                    _id: "$pillar",
                    totalCollected: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]);
        
        return stats;
    }
}
module.exports = TreasuryAnalytics;
