// models/RhythmContent.js
const mongoose = require('mongoose');

const RhythmContentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['MUSIC', 'COMEDY'], required: true },
    url: String, // Link to media storage (e.g., S3/Cloudfront)
    scheduledAt: Date,
    status: { type: String, enum: ['PENDING', 'LIVE', 'ARCHIVED'], default: 'PENDING' },
    views: { type: Number, default: 0 }
});

module.exports = mongoose.model('RhythmContent', RhythmContentSchema);
