const Listing = require('../models/Listing');
const TreasuryLog = require('../models/TreasuryLog');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Configuration validation on boot
const BPS = Number(process.env.PLATFORM_LISTING_FEE_PERCENT_BPS || 1000);
if (isNaN(BPS) || BPS < 0 || BPS > 10000) {
    throw new Error('Invalid or missing PLATFORM_LISTING_FEE_PERCENT_BPS configuration.');
}

/**
 * Creates a new bazaar listing. 
 * Validation logic is performed before resource-intensive session/transaction start.
 */
exports.createItem = async (req, res) => {
    const { title, description, price, category, stockQuantity } = req.body;
    
    // 1. Validation (Before transaction overhead)
    if (!title?.trim() || !category?.trim()) return res.status(400).json({ status: "error", message: "Missing required fields." });
    
    const priceCents = Number(price);
    const stock = Number(stockQuantity);
    if (!Number.isInteger(priceCents) || priceCents <= 0) return res.status(400).json({ status: "error", message: "Invalid price." });
    if (!Number.isInteger(stock) || stock < 0) return res.status(400).json({ status: "error", message: "Invalid stock." });

    // 2. Transaction start only after input is validated
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const sellerId = req.user.id;
        const txRef = crypto.randomUUID();
        const feeCents = Math.round((priceCents * BPS) / 10000);

        const [listing] = await Listing.create([{
            title: title.trim(),
            description: description?.trim(),
            price: priceCents,
            category,
            stockQuantity: stock,
            sellerId,
            status: 'active',
            approval: 'pending',
            txRef
        }], { session });

        await TreasuryLog.create([{
            listingId: listing._id,
            sellerId,
            grossAmount: priceCents,
            feeAmount: feeCents,
            netAmount: priceCents - feeCents,
            feeBasisPoints: BPS,
            currency: 'NGN',
            txRef,
            status: 'captured'
        }], { session });

        await AuditLog.create([{
            action: 'CREATE_LISTING',
            actorId: sellerId,
            documentId: listing._id,
            txRef,
            status: 'success'
        }], { session });

        await session.commitTransaction();
        res.status(201).json({ status: "success", data: { listing, platformFee: feeCents, txRef } });
    } catch (error) {
        await session.abortTransaction();
        console.error({ route: req.originalUrl, method: req.method, error: error.message, stack: error.stack });
        res.status(500).json({ status: "error", message: "Failed to process listing." });
    } finally {
        session.endSession();
    }
};

/**
 * Fetch items with clamped pagination and field selection.
 */
exports.getAllItems = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
        const { category, sellerId } = req.query;

        const query = { status: 'active', approval: 'approved', deletedAt: null };
        if (category) query.category = category;
        if (sellerId) query.sellerId = sellerId;

        const [items, total] = await Promise.all([
            Listing.find(query)
                .select("title price category sellerId stockQuantity createdAt")
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit)
                .lean(),
            Listing.countDocuments(query)
        ]);

        res.status(200).json({ 
            status: "success", 
            pagination: { page, limit, totalPages: Math.ceil(total / limit), total },
            data: items 
        });
    } catch (error) {
        console.error({ route: req.originalUrl, method: req.method, error: error.message, stack: error.stack });
        res.status(500).json({ status: "error", message: "Failed to retrieve items." });
    }
};
