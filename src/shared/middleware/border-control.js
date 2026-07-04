const { error } = require('../helpers/response.helper');
const GovernanceEngine = require('../../core/governance/governance.engine');

/**
 * Border Control: The Final Gatekeeper
 * Every single request to the 8 pillars must pass through here.
 */
const BorderControl = {
    async authorize(req, res, next) {
        // 1. Platform-wide Emergency Shutdown Check
        if (process.env.PLATFORM_STATUS === 'MAINTENANCE') {
            return error(res, "House-of-Coral is currently undergoing system upgrades. Please stand by.", 503);
        }

        // 2. Authentication Verification
        if (!req.user) {
            return error(res, "Access Denied: Valid Citizenship Passport Required.", 401);
        }

        // 3. Global Governance Override
        // This is where you can manually force-ban a user or force-update a status
        const isBanned = await GovernanceEngine.isUserBanned(req.user.id);
        if (isBanned) {
            return error(res, "Access Denied: This account has been restricted by Central Command.", 403);
        }

        next();
    }
};

module.exports = BorderControl;
