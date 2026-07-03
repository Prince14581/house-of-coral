const TreasuryLog = require('../models/TreasuryLog');

exports.getSIMRevenueStats = async (req, res) => {
    try {
        const stats = await TreasuryLog.aggregate([
            {
                $group: {
                    _id: "$phoneNumber", 
                    totalRevenue: { $sum: "$feeAmount" },
                    transactionCount: { $sum: 1 },
                    lastActive: { $max: "$createdAt" }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        res.status(200).json({
            status: "success",
            reportDate: new Date(),
            data: stats
        });
    } catch (error) {
        res.status(500).json({ message: "Error generating SIM stats", error: error.message });
    }
};
