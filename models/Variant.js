const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  attributes: { type: Map, of: String }, // e.g., { "color": "blue", "size": "XL" }
  sku: { type: String, required: true, unique: true },
  priceAdjustment: { type: Number, default: 0 }, // e.g., +$10 for "Large"
  stockQuantity: { type: Number, default: 0 }
});

VariantSchema.index({ productId: 1, sku: 1 });
module.exports = mongoose.model('Variant', VariantSchema);
