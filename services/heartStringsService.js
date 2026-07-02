// services/heartStringsService.js
const HeartStrings = require('../models/HeartStrings');
const SocialPrivacy = require('../models/SocialPrivacy');

exports.sendConnectionRequest = async (senderId, receiverId) => {
    // 1. Check if receiver has blocked sender
    const privacy = await SocialPrivacy.findOne({ userId: receiverId });
    if (privacy && privacy.blockedUsers.includes(senderId)) {
        throw new Error("Cannot connect: User has blocked you.");
    }

    return await HeartStrings.create({
        userA: senderId,
        userB: receiverId,
        status: 'PENDING'
    });
};
