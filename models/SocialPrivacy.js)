// models/SocialPrivacy.js
const mongoose = require('mongoose');

const SocialPrivacySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reports: [{
        targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        timestamp: { type: Date, default: Date.now },
        status: { type: String, enum: ['PENDING', 'REVIEWED'], default: 'PENDING' }
    }]
});

module.exports = mongoose.model('SocialPrivacy', SocialPrivacySchema);
