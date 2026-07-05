const TreasuryService = require('./TreasuryService');
const User = require('../models/User');

class UnifiedWalletService {
  /**
   * Universal method to process payments across all pillars
   */
  async processGlobalTransaction(userId, amount, pillarContext, metadata) {
    const fee = amount * 0.10;
    const netAmount = amount - fee;

    try {
      // 1. Check User Balance
      const user = await User.findById(userId);
      if (user.balance < amount) throw new Error('Insufficient funds');

      // 2. Execute Transfer to Treasury
      await TreasuryService.recordTransaction({
        userId,
        amount: fee,
        type: 'PLATFORM_FEE',
        sourcePillar: pillarContext,
        refId: metadata.refId
      });

      // 3. Update User Balance
      user.balance -= amount;
      await user.save();

      return { success: true, newBalance: user.balance };
    } catch (error) {
      console.error(`[Wallet Error] Pillar: ${pillarContext}`, error);
      throw error;
    }
  }

  async getGlobalBalance(userId) {
    const user = await User.findById(userId);
    return user.balance;
  }
}

module.exports = new UnifiedWalletService();
