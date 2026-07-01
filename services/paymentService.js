// services/paymentService.js
const mongoose = require('mongoose');
const Ledger = require('../models/Ledger');

exports.processBazaarTransaction = async (buyerId, amount, itemId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const fee = amount * 0.10; // 10% platform fee
        const netAmount = amount - fee;

        // 1. Record the ledger entry (Atomic)
        await Ledger.create([{
            userId: buyerId,
            amount: netAmount,
            fee: fee,
            pillar: 'BAZAAR',
            status: 'COMPLETED'
        }], { session });

        // 2. Logic to trigger Inventory release (e.g., call your Inventory DB)
        // await Inventory.decrementStock(itemId, { session });

        await session.commitTransaction();
        return { success: true, feeCaptured: fee };
    } catch (error) {
        await session.abortTransaction();
        throw new Error("Payment Processing Failed: " + error.message);
    } finally {
        session.endSession();
    }
};
