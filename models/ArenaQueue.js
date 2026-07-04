// models/ArenaQueue.js
const mongoose = require('mongoose');

const arenaQueueSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rank: { type: Number, required: true },
    trustScore: { type: Number, required: true },
    joinedAt: { type: Date, default: Date.now }
});

// Automatically remove from queue after 5 minutes of inactivity
arenaQueueSchema.index({ joinedAt: 1 }, { expireAfterSeconds: 300 });

module.exports = mongoose.model('ArenaQueue', arenaQueueSchema);
