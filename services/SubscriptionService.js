// src/modules/Treasury/subscription/SubscriptionService.js
const cron = require('node-cron');
const Subscription = require('./Subscription');
const TreasuryService = require('../TreasuryService');

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
    const today = new Date();
    const dueSubscriptions = await Subscription.find({ 
        nextBillingDate: { $lte: today },
        status: 'ACTIVE' 
    });

    for (const sub of dueSubscriptions) {
        try {
            // Trigger Treasury Payout (User -> Platform)
            await TreasuryService.processTransaction({
                sender: sub.userId,
                receiver: 'HOUSE_OF_CORAL_TREASURY',
                amount: sub.price,
                type: 'SUBSCRIPTION_RENEWAL'
            });

            // Update next billing date (e.g., +30 days)
            sub.nextBillingDate = new Date(today.setDate(today.getDate() + 30));
            await sub.save();
        } catch (err) {
            sub.status = 'PAST_DUE';
            await sub.save();
        }
    }
});
