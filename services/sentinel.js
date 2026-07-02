// services/sentinel.js
const Ledger = require('../models/Ledger');
const SystemStatus = require('../models/SystemStatus');

exports.checkHealthAndLock = async () => {
    // Look for failures in the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const recentFails = await Ledger.countDocuments({ 
        status: 'FAILED', 
        timestamp: { $gte: tenMinutesAgo } 
    });

    // Threshold: If more than 10 failures in 10 minutes, trip the circuit breaker
    if (recentFails >= 10) {
        await SystemStatus.findOneAndUpdate({}, { 
            isLocked: true, 
            lockReason: "High failure rate in transaction processing." 
        });
        return { locked: true, reason: "Excessive failures detected." };
    }
    return { locked: false };
};
