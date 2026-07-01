const mongoose = require('mongoose');

const LedgerSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    pillar: { type: String, required: true }, // e.g., 'Bazaar', 'Arena'
    amount: { type: Number, required: true },
    type: { type: String, enum: ['credit', 'debit', 'fee'], required: true },
    activityId: { type: String, required: true, unique: true }, // Links to Task or Transaction
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ledger', LedgerSchema);
