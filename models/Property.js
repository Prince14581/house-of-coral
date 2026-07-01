const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
    ownerId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    status: { type: String, enum: ['available', 'rented', 'sold'], default: 'available' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Property', PropertySchema);
