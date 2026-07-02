// middleware/privacyGuard.js
const SocialPrivacy = require('../models/SocialPrivacy');

exports.checkBlockStatus = async (req, res, next) => {
    const { targetId } = req.body;
    const userId = req.user.id;

    const privacy = await SocialPrivacy.findOne({ userId });
    
    if (privacy && privacy.blockedUsers.includes(targetId)) {
        return res.status(403).json({ error: "Interaction restricted." });
    }
    next();
};
