const User = require('../models/User');
const Listing = require('../models/Listing');
const Escrow = require('../models/Escrow');
const AuditLog = require('../models/AuditLog');

/**
 * Platform health dashboard.
 */
exports.getPlatformAnalytics = async (req, res) => {
    const started = Date.now();
    try {
        const [userCount, listingCount, totalEscrowVolume, recentAuditCount] = await Promise.all([
            User.countDocuments({ deletedAt: null, status: 'active' }),
            Listing.countDocuments({ deletedAt: null, status: 'active', approval: 'approved' }),
            Escrow.aggregate([
                { $match: { deletedAt: null, status: 'held' } },
                { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } }
            ]).allowDiskUse(true).option({ maxTimeMS: 10000 }),
            AuditLog.countDocuments({ createdAt: { $gte: new Date(Date.now() - 86400000) } })
        ]);

        AuditLog.create({ 
            action: 'VIEW_PLATFORM_ANALYTICS', 
            actorId: req.user?._id, 
            collectionName: 'Analytics', 
            documentId: req.user?._id, 
            status: 'success' 
        }).catch(err => console.error('Non-blocking AuditLog failed:', err));

        res.status(200).json({
            status: "success",
            reportDate: new Date().toISOString(),
            meta: { executionTimeMs: Date.now() - started },
            data: {
                userEngagement: { totalUsers: userCount, activeAuditEvents24h: recentAuditCount },
                bazaarMetrics: { activeListings: listingCount },
                treasuryMetrics: { lockedEscrowVolume: totalEscrowVolume[0]?.total || 0 }
            }
        });
    } catch (error) {
        console.error({ route: req.originalUrl, method: req.method, error: error.message, stack: error.stack });
        res.status(500).json({ status: "error", message: "Failed to compile platform analytics." });
    }
};

/**
 * Granular category performance with corrected summary aggregation.
 */
exports.getCategoryPerformance = async (req, res) => {
    const started = Date.now();
    try {
        const report = await Listing.aggregate([
            { $match: { deletedAt: null, approval: 'approved', status: { $ne: 'archived' } } },
            // Step 1: Group by category first
            { $group: { 
                _id: "$category", 
                count: { $sum: 1 }, 
                avgPrice: { $avg: { $toDouble: "$price" } },
                totalViews: { $sum: "$views" },
                totalInventory: { $sum: "$stockQuantity" },
                totalSold: { $sum: "$soldCount" }
            }},
            // Step 2: Facet to calculate summary from the groups
            { $facet: {
                data: [{ $sort: { totalSold: -1, totalViews: -1 } }],
                summary: [{
                    $group: {
                        _id: null,
                        categories: { $sum: 1 },
                        totalListings: { $sum: "$count" },
                        totalInventory: { $sum: "$totalInventory" },
                        totalViews: { $sum: "$totalViews" },
                        totalSold: { $sum: "$totalSold" }
                    }
                }]
            }}
        ]).allowDiskUse(true).option({ maxTimeMS: 10000 });

        AuditLog.create({ 
            action: 'VIEW_CATEGORY_ANALYTICS', 
            actorId: req.user?._id, 
            collectionName: 'Analytics', 
            documentId: req.user?._id, 
            status: 'success' 
        }).catch(err => console.error('Non-blocking AuditLog failed:', err));

        res.status(200).json({ 
            status: "success", 
            reportDate: new Date().toISOString(),
            meta: { executionTimeMs: Date.now() - started },
            summary: report[0].summary[0] || {},
            data: report[0].data 
        });
    } catch (error) {
        console.error({ route: req.originalUrl, method: req.method, error: error.message, stack: error.stack });
        res.status(500).json({ status: "error", message: "Failed to fetch category stats." });
    }
};
