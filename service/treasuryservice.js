// services/TreasuryService.js
const crypto = require('crypto');
const TreasuryRepository = require('../repositories/TreasuryRepository');

class TreasuryService {
    static FEE_PERCENTAGE = 0.10;
    static SECRET_KEY = process.env.TREASURY_SECRET; // Ensure this is in your .env

    static async processTransaction(transactionData) {
        const { amount } = transactionData;
        const fee = amount * this.FEE_PERCENTAGE;
        const netAmount = amount - fee;

        const txPayload = { ...transactionData, fee, netAmount, timestamp: new Date() };

        // Generate HMAC signature for the payload
        const signature = this.generateSignature(txPayload);

        try {
            // Save with signature
            await TreasuryRepository.logTransaction({ ...txPayload, signature });
            await this.routeToTreasuryNode(fee);
            return { success: true, fee, netAmount };
        } catch (error) {
            throw new Error('Treasury security breach or database failure.');
        }
    }

    static generateSignature(data) {
        return crypto
            .createHmac('sha256', this.SECRET_KEY)
            .update(JSON.stringify(data))
            .digest('hex');
    }
}
