class TradePolicy {
    static getTradeLimits(userTier) {
        const tiers = {
            'MICRO': { maxTrade: 500, requiresManualReview: false },
            'SME': { maxTrade: 50000, requiresManualReview: true },
            'INSTITUTIONAL': { maxTrade: 10000000, requiresManualReview: true }
        };
        return tiers[userTier];
    }
}
