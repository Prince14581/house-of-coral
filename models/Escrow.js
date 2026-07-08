const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { Decimal128 } = mongoose.Types;

const EscrowSchema = new mongoose.Schema({
    escrowId: { type: String, default: uuidv4, unique: true, immutable: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', index: true },

    // Financial Breakdown
    amount: { type: Decimal128, required: true },
    subtotal: { type: Decimal128, required: true },
    shippingFee: { type: Decimal128, default: () => Decimal128.fromString('0') },
    platformFee: { type: Decimal128, required: true },
    sellerReceivable: { type: Decimal128, required: true },
    currency: { type: String, enum: ['HFC', 'NGN', 'USD', 'EUR'], default: 'HFC', uppercase: true },

    // Ledger Audit Trail
    holdLedgerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' },
    releaseLedgerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' },
    refundLedgerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' },

    // Lifecycle & Dispute Management
    status: { type: String, enum: ['held', 'released', 'disputed', 'refunded'], default: 'held', index: true },
    releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    releasedAt: Date,

    disputedAt: Date,
    disputedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    disputeReason: { type: String, trim: true },
    resolvedAt: Date,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    expiresAt: { type: Date, required: true },
    deletedAt: { type: Date, default: null, index: true }
}, { 
    timestamps: true, 
    optimisticConcurrency: true, 
    versionKey: false,
    toJSON: { virtuals: true, transform(doc, ret) { delete ret.deletedAt; return ret; } },
    toObject: { virtuals: true, transform(doc, ret) { delete ret.deletedAt; return ret; } }
});

// -- Indexes --
EscrowSchema.index({ buyerId: 1, status: 1 });
EscrowSchema.index({ sellerId: 1, status: 1 });
EscrowSchema.index({ orderId: 1, status: 1 });
EscrowSchema.index({ paymentId: 1 });

// -- Financial Consistency Validation --
EscrowSchema.pre('validate', function(next) {
    if (this.expiresAt <= new Date()) return next(new Error('Expiration must be in the future.'));

    const amt = parseFloat(this.amount.toString());
    const sub = parseFloat(this.subtotal.toString());
    const ship = parseFloat(this.shippingFee.toString());
    const fee = parseFloat(this.platformFee.toString());
    const recv = parseFloat(this.sellerReceivable.toString());

    if (Math.abs(amt - (sub + ship)) > 0.001) return next(new Error('Amount must equal subtotal + shipping.'));
    if (Math.abs(recv - (amt - fee)) > 0.001) return next(new Error('Receivable must equal amount - platform fee.'));
    
    // Dispute state enforcement
    if (this.status === 'disputed' && (!this.disputedAt || !this.disputeReason)) {
        return next(new Error('Dispute requires date and reason.'));
    }
    
    next();
});

// -- Middleware --
EscrowSchema.pre(/^find/, function(next) {
    this.where({ deletedAt: null });
    next();
});

module.exports = mongoose.model('Escrow', EscrowSchema);

