// middleware/pillarGuard.js
const SystemStatus = require('../models/SystemStatus');

exports.checkPlatformLock = async (req, res, next) => {
    const status = await SystemStatus.findOne({ id: 'global_config' });
    
    if (status && status.isLocked) {
        return res.status(503).json({ 
            error: "Platform Maintenance", 
            message: "Transaction processing is currently disabled due to a security audit. Please contact support." 
        });
    }
    next();
};
