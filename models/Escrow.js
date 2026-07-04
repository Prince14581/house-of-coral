// models/Escrow.js
const mongoose = require('mongoose');

const escrowSchema = new mongoose.Schema({
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['HELD', 'RELEASED', 'REFUNDED', 'DISPUTED'], 
        default: 'HELD' 
    },
    trackingInfo: String, // Added by seller
    deliveryConfirmed: { type: Boolean, default: false }
});

module.exports = mongoose.model('Escrow', escrowSchema);
