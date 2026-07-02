// models/Recharge.js
const mongoose = require('mongoose');

const RechargeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    phone: String,
    amount: Number,
    reference: { type: String, unique: true }, // Prevents double-spending
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recharge', RechargeSchema);
