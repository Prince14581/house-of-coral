// middleware/legalCompliance.js
const User = require('../models/User');

exports.checkLegalAgreement = (pillar) => {
    return async (req, res, next) => {
        const user = await User.findById(req.userId);
        
        // Ensure user has accepted the specific terms for the requested pillar
        if (!user.acceptedTerms.includes(pillar)) {
            return res.status(403).json({ 
                error: `Legal Agreement Required: You must accept the ${pillar} Terms of Service before proceeding.` 
            });
        }
        next();
    };
};
