const mongoose = require('mongoose');

const identityProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    tier: { type: Number, default: 1, enum: [1, 2, 3] }, // 1: Starter, 2: Merchant, 3: Sovereign
    trustScore: { type: Number, default: 0 },
    verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified'], default: 'unverified' },
    phoneNumber: { type: String, required: true, unique: true }, // SIM Identity
    followerCount: { type: Number, default: 0 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
}, { timestamps: true });

module.exports = mongoose.model('IdentityProfile', identityProfileSchema);
