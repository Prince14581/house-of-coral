const { SocialService } = require('../services/social.service');
const GovernanceEngine = require('../../../core/governance/governance.engine');

exports.createPost = async (req, res) => {
    try {
        // Governance/Policy check
        const allowed = await GovernanceEngine.canPerform(req.user.id, 'POST_CONTENT');
        if (!allowed) {
            return res.status(403).json({ success: false, message: "Governance restriction: Post denied." });
        }

        // Action
        const post = await SocialService.createPost(req.user.id, req.body.content);
        
        // Success
        res.status(201).json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
