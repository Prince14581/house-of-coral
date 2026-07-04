const IdentityProfile = require('../../../core/identity/models/identityProfile.model');

class HeartStringsService {
    static async findMatches(userId) {
        // Query users with similar "Trust Scores" or "Interests"
        const currentUser = await IdentityProfile.findOne({ userId });
        
        return await IdentityProfile.find({
            trustScore: { $gte: currentUser.trustScore - 100 },
            userId: { $ne: userId }
        }).limit(10);
    }
}
module.exports = HeartStringsService;
