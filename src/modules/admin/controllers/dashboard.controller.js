const TreasuryAnalytics = require('../../../core/treasury/services/analytics.service');
const GovernanceEngine = require('../../../core/governance/governance.engine');

exports.getTreasuryStatus = async (req, res) => {
    // SECURITY: Only the FOUNDER can see this.
    const isOwner = await GovernanceEngine.canPerform(req.user.id, 'VIEW_TREASURY_STATS');
    if (!isOwner) return res.status(403).send("Unauthorized Access");

    const stats = await TreasuryAnalytics.getRealTimeStats();
    
    res.json({
        success: true,
        data: {
            totalReserve: 45000000, // Hard-coded base reserve
            realTimeFlow: stats,
            timestamp: new Date()
        }
    });
};
