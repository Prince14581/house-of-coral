// src/modules/Treasury/ledger/LedgerEntry.js
const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
    txId: { type: String, required: true, unique: true },
    fromAccount: { type: String, required: true }, // 'USER_ID' or 'TREASURY'
    toAccount: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    type: { type: String, enum: ['DEPOSIT', 'WITHDRAWAL', 'ESCROW_HOLD', 'PLATFORM_FEE', 'PAYOUT'] },
    status: { type: String, default: 'COMPLETED' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ledger', ledgerSchema);
