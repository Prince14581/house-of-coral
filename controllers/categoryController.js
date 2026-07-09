const Listing = require('../models/Listing');
const AuditLog = require('../models/AuditLog');

const PUBLIC_FILTER = { 
    status: 'active', 
    approval: 'approved', 
    deletedAt: null 
};

/**
 * Aggregates listing statistics with defensive financial precision.
 */
exports.getCategoryStats = async (req, res) => {
    const started = Date.now();
    try {
        const stats = await Listing.aggregate([
            { $match: PUBLIC_FILTER },
            {
                $group: {
                    _id: { $toLower: { $trim: { input: "$category" } } },
                    count: { $sum: 1 },
                    totalStock: { $sum: "$stockQuantity" },
                    sumPrice: { $sum: "$price" }
                }
            },
            {
                $facet: {
                    summary: [
                        {
                            $group: {
                                _id: null,
                                totalCategories: { $sum: 1 },
                                totalListings: { $sum: "$count" },
                                totalInventory: { $sum: "$totalStock" },
                                totalSumPrice: { $sum: "$sumPrice" }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalCategories: { $ifNull: ["$totalCategories", 0] },
                                totalListings: { $ifNull: ["$totalListings", 0] },
                                totalInventory: { $ifNull: ["$totalInventory", 0] },
                                avgPlatformPrice: {
                                    $cond: [{ $gt: ["$totalListings", 0] }, { $divide: ["$totalSumPrice", "$totalListings"] }, 0]
                                }
                            }
                        }
                    ],
                    data: [
                        {
                            $project: {
                                _id: 0,
                                category: "$_id",
                                count: 1,
                                totalStock: 1,
                                avgPrice: {
                                    $cond: [{ $gt: ["$count", 0] }, { $divide: ["$sumPrice", "$count"] }, 0]
                                }
                            }
                        },
                        { $sort: { count: -1 } }
                    ]
                }
            }
        ]);

        // Default to empty objects if dataset is empty
        const result = {
            summary: stats[0].summary[0] || { totalCategories: 0, totalListings: 0, totalInventory: 0, avgPlatformPrice: 0 },
            data: stats[0].data
        };

        AuditLog.create({ 
            action: 'VIEW_CATEGORY_ANALYTICS', 
            actorId: req.user?.id || 'system', 
            status: 'success',
            metadata: { ip: req.ip, durationMs: Date.now() - started } 
        }).catch(err => console.error('AuditLog Analytics Fail:', err));

        res.status(200).json({ 
            status: "success", 
            meta: { executionTimeMs: Date.now() - started, reportDate: new Date().toISOString() },
            data: result 
        });
    } catch (error) {
        console.error({ route: req.originalUrl, method: req.method, error: error.message, stack: error.stack });
        res.status(500).json({ status: "error", message: "Failed to aggregate stats." });
    }
};

/**
 * Retrieves normalized unique active categories.
 */
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Listing.aggregate([
            { $match: PUBLIC_FILTER },
            { $group: { _id: { $toLower: { $trim: { input: "$category" } } } } },
            { $sort: { "_id": 1 } },
            { $project: { _id: 0, category: "$_id" } }
        ]);

        res.status(200).json({ 
            status: "success", 
            data: categories.map(item => item.category) 
        });
    } catch (error) {
        console.error({ route: req.originalUrl, method: req.method, error: error.message, stack: error.stack });
        res.status(500).json({ status: "error", message: "Failed to retrieve categories." });
    }
};
