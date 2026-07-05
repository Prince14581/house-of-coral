const TreasuryLog = require('../models/TreasuryLog');
const Product = require('../models/Product');

class AnalyticsService {
  // Get platform-wide revenue and sales volume
  async getMarketplaceStats(sellerId = null) {
    const match = { source: { $in: ['BAZAAR', 'BAZAAR_DISCOUNTED', 'TERRAHOUSE'] } };
    if (sellerId) match.userId = sellerId; // Filter by vendor

    const stats = await TreasuryLog.aggregate([
      { $match: match },
      { $group: { 
          _id: null, 
          totalGMV: { $sum: '$amount' }, // Note: This represents the captured fees
          transactionCount: { $sum: 1 } 
      }}
    ]);

    return stats[0] || { totalGMV: 0, transactionCount: 0 };
  }
}

module.exports = new AnalyticsService();
