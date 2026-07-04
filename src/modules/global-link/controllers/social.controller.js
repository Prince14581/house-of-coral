const { SocialService } = require('../services/social.service');
const GovernanceEngine = require('../../../core/governance/governance.engine');

exports.follow = async (req, res) => {
    // Permission check via the Governance Engine
    const allowed = await GovernanceEngine.canPerform(req.user.id, 'POST_CONTENT');
    if (!allowed) return res.status(403).json({ message: "Action not permitted." });

    await SocialService.followUser(req.user.id, req.body.targetUserId);
    res.status(200).json({ success: true, message: "Followed successfully." });
};
