// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    amount: { type: Number, required: true },
    fee: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    type: { type: String, required: true }, // e.g., 'Bazaar', 'Arena'
    timestamp: { type: Date, default: Date.now },
    // HMAC-SHA256 signature for integrity
    signature: { type: String, required: true } 
});

module.exports = mongoose.model('Transaction', transactionSchema);
