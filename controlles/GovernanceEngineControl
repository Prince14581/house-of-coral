const GovernanceEngine = require('../../core/governance/governance.engine');

exports.createListing = async (req, res) => {
    // ONE LINE OF PERMISSION CHECK
    const allowed = await GovernanceEngine.canPerform(req.user.id, 'CREATE_SHOP');
    
    if (!allowed) {
        return res.status(403).json({ message: "Access Denied: Tier upgrade required." });
    }

    // ... proceed with listing logic
};
