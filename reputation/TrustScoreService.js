// src/modules/Identity/reputation/TrustScoreService.js
class TrustScoreService {
    static async updateScore(userId, eventType) {
        const multipliers = {
            'SUCCESSFUL_SALE': 20,
            'DISPUTE_WON': 50,
            'ARENA_WIN': 5
        };

        const points = multipliers[eventType] || 0;
        
        // Atomically update user TrustScore
        return await Identity.findOneAndUpdate(
            { userId },
            { $inc: { trustScore: points } },
            { new: true }
        );
    }
}
