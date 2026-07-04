const { socialEvents } = require('../services/social.service');
const IdentityProfile = require('../../../core/identity/models/identityProfile.model');

socialEvents.on('MESSAGE_SENT', async (data) => {
    // Audit log: Update last message timestamp
    await IdentityProfile.updateOne(
        { userId: data.senderId },
        { $set: { lastActive: new Date() } }
    );
});
