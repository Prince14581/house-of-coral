// Catalog Model
const catalogSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    description: String,
    category: String,
    media: [String], // URLs to storage
    metadata: Map // For flexible attributes (e.g., color, size)
});

// Inventory Model
const inventorySchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Catalog' },
    sku: { type: String, unique: true },
    price: Number,
    stockCount: { type: Number, min: 0 },
    status: { type: String, enum: ['AVAILABLE', 'OUT_OF_STOCK', 'DRAFT'] }
});
