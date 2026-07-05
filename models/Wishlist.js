const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetType: { type: String, enum: ['product', 'event'], required: true },
    addedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Ensure faster lookups for a user's wishlist
WishlistSchema.index({ userId: 1 });

module.exports = mongoose.model('Wishlist', WishlistSchema);
