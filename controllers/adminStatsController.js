const TreasuryLog = require('../models/TreasuryLog');

/**
 * Retrieves SIM-based revenue statistics with optimized facet-based pagination,
 * server-side date normalization, and aggregate summary metrics.
 */
exports.getSIMRevenueStats = async (req, res) => {
    const started = Date.now();
    try {
        const { startDate, endDate, limit = 50, page = 1, sortBy = 'totalRevenue' } = req.query;
        
        // 1. Validation & Normalization
        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
        const allowedSort = ['totalRevenue', 'transactionCount', 'lastActive'];
        const sortField = allowedSort.includes(sortBy) ? sortBy : 'totalRevenue';

        const matchStage = {};
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && isNaN(start)) return res.status(400).json({ status: "error", message: "Invalid startDate." });
            if (end && isNaN(end)) return res.status(400).json({ status: "error", message: "Invalid endDate." });
            if (start && end && start > end) return res.status(400).json({ status: "error", message: "startDate cannot be later than endDate." });

            matchStage.createdAt = {};
            if (start) matchStage.createdAt.$gte = start;
            if (end) {
                end.setUTCHours(23, 59, 59, 999);
                matchStage.createdAt.$lte = end;
            }
        }

        // 2. Aggregation Pipeline
        const report = await TreasuryLog.aggregate([
            { $match: matchStage },
            {
                $facet: {
                    data: [
                        { $group: { 
                            _id: "$phoneNumber", 
                            totalRevenue: { $sum: { $toDouble: "$feeAmount" } }, 
                            transactionCount: { $sum: 1 }, 
                            lastActive: { $max: "$createdAt" } 
                        }},
                        { $sort: { [sortField]: -1 } },
                        { $skip: (pageNumber - 1) * limitNumber },
                        { $limit: limitNumber },
                        { $project: { _id: 0, phoneNumber: "$_id", totalRevenue: 1, transactionCount: 1, lastActive: 1 } }
                    ],
                    totalCount: [{ $group: { _id: "$phoneNumber" } }, { $count: "count" }],
                    summary: [{
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: { $toDouble: "$feeAmount" } },
                            totalTransactions: { $sum: 1 }
                        }
                    }]
                }
            }
        ]).allowDiskUse(true);

        // 3. Response
        const result = report[0];
        const totalRecords = result.totalCount[0]?.count || 0;
        
        res.status(200).json({
            status: "success",
            reportDate: new Date(),
            meta: { executionTimeMs: Date.now() - started },
            pagination: {
                totalRecords,
                totalPages: Math.ceil(totalRecords / limitNumber),
                currentPage: pageNumber,
                limit: limitNumber
            },
            summary: result.summary[0] || { totalRevenue: 0, totalTransactions: 0 },
            data: result.data
        });

    } catch (error) {
        console.error('SIM Revenue Stats Error:', error);
        res.status(500).json({ status: "error", message: "Internal server error during report generation." });
    }
};
