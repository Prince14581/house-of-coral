// src/modules/Governance/models/Proposal.js
const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    proposerId: { type: String, required: true },
    type: { type: String, enum: ['FUNDING', 'RULE_CHANGE', 'COMMITTEE'], required: true },
    
    // Temporal Logic
    status: { type: String, enum: ['ACTIVE', 'PASSED', 'REJECTED', 'EXPIRED'], default: 'ACTIVE' },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { 
        type: Date, 
        required: true,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
    },
    
    // Results
    results: {
        pro: { type: Number, default: 0 },
        contra: { type: Number, default: 0 }
    },
    voters: [{ userId: String, vote: String }]
});

// Index for background cleanup of expired proposals
proposalSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('Proposal', proposalSchema);
