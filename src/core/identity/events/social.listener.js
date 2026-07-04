const { socialEvents } = require('../../../modules/global-link/services/social.service');
const IdentityProfile = require('../models/identityProfile.model');

// When a follow event happens, automatically increment follower count
socialEvents.on('USER_FOLLOWED', async (data) => {
    await IdentityProfile.updateOne(
        { userId: data.followingId },
        { $inc: { followerCount: 1 } }
    );
    // Trigger tier sync to check if they leveled up
    // await IdentityService.syncTier(data.followingId); 
});
