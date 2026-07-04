const IdentityProfile = require('../models/identityProfile.model');

class IdentityService {
    static async getProfile(userId) {
        return await IdentityProfile.findOne({ userId });
    }

    // Logic to calculate Tier based on follower count
    static async syncTier(userId) {
        const profile = await IdentityProfile.findOne({ userId });
        if (!profile) return;

        let newTier = 1;
        if (profile.followerCount >= 10000) newTier = 3;
        else if (profile.followerCount >= 1000) newTier = 2;

        if (newTier !== profile.tier) {
            profile.tier = newTier;
            await profile.save();
        }
    }
}

module.exports = IdentityService;
