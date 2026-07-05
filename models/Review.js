const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID of Product/Event
  targetType: { type: String, enum: ['product', 'event', 'stream'], required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 },
}, { timestamps: true });

// Prevent duplicate reviews from the same user for the same item
ReviewSchema.index({ userId: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
