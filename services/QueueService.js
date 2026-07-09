// src/modules/Arena/matchmaking/QueueService.js
const redis = require('../../../infrastructure/RedisClient');

class QueueService {
    static async joinQueue(userId, rank) {
        // Add user to a sorted set based on rank
        await redis.zadd('arena_queue', rank, userId);
    }

    static async findMatch(userId, rank) {
        // Find players within +/- 100 rank points
        const opponents = await redis.zrangebyscore('arena_queue', rank - 100, rank + 100);
        // ... Logic to pair and remove from queue ...
    }
}
