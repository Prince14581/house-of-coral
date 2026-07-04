const { Follow, Post } = require('../models/social.model');
const EventEmitter = require('events');
const socialEvents = new EventEmitter(); // Central event bus for this module

class SocialService {
    static async followUser(followerId, followingId) {
        const follow = await Follow.create({ followerId, followingId });
        
        // Emit event: The Governance/Identity engine will listen for this
        socialEvents.emit('USER_FOLLOWED', { followerId, followingId });
        
        return follow;
    }

    static async createPost(authorId, content) {
        const post = await Post.create({ authorId, content });
        socialEvents.emit('POST_CREATED', { authorId, postId: post._id });
        return post;
    }
}

module.exports = { SocialService, socialEvents };
