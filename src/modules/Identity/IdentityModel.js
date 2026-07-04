const mongoose = require('mongoose');

const identitySchema = new mongoose.Schema({
    // Core Identification
    userId: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true },
    
    // Authorization & Status
    role: { 
        type: String, 
        enum: ['USER', 'PRO', 'MOD', 'ADMIN'], 
        default: 'USER' 
    },
    status: { 
        type: String, 
        enum: ['ACTIVE', 'SUSPENDED', 'VERIFIED'], 
        default: 'ACTIVE' 
    },

    // Reputation Engine (Linked to SecurityGuard)
    trustScore: { type: Number, default: 0, min: 0 },
    badges: [{ type: String }], // e.g., 'TRUSTED_TRADER', 'TOURNAMENT_WINNER'

    // Profile Metadata
    profile: {
        username: String,
        bio: String,
        avatarUrl: String,
        kycLevel: { type: Number, default: 0 } // 0: None, 1: Basic, 2: Full
    },

    // Subscription & Financial Reference
    subscription: {
        plan: { type: String, enum: ['BASIC', 'PRO', 'ELITE'], default: 'BASIC' },
        expiry: Date
    },

    // Security
    publicKey: { type: String }, // For E2EE messaging in Global Link
    lastLogin: { type: Date, default: Date.now }
}, { 
    timestamps: true 
});

// Indexing for high-performance lookups in the AccessGuard
identitySchema.index({ userId: 1, role: 1, trustScore: 1 });

module.exports = mongoose.model('Identity', identitySchema);
