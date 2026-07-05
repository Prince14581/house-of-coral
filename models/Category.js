const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  pillar: { type: String, enum: ['Bazaar', 'Jubilee'], required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Index for high-speed hierarchy lookups
CategorySchema.index({ pillar: 1, parentId: 1 });

module.exports = mongoose.model('Category', CategorySchema);
