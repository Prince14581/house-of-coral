// models/Dispute.js
const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
    escrowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Escrow', required: true },
    complainantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED'], default: 'OPEN' },
    reason: String,
    decision: String,
    evidence: [{
        submittedBy: String,
        fileUrl: String,
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Dispute', disputeSchema);
