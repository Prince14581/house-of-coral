const mongoose = require('mongoose');

const identitySchema = new mongoose.Schema({
    simId: { type: String, required: true, unique: true }, // The Primary Mobile Identifier
    trustScore: { type: Number, default: 0 },
    tier: { type: String, enum: ['CITIZEN', 'MERCHANT', 'SOVEREIGN'], default: 'CITIZEN' },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'BANNED'], default: 'ACTIVE' },
    metadata: { type: Object, default: {} }
});

module.exports = mongoose.model('Identity', identitySchema);
