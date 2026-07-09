// routes/webhooks.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const treasuryService = require('../services/treasuryService');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY; // Stored securely in Render

router.post('/paystack', async (req, res) => {
    // 1. Verify Signature: Ensure the request is genuine
    const hash = crypto
        .createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).send('Unauthorized: Invalid Signature');
    }

    // 2. Process Authorized Event
    const event = req.body;
    if (event.event === 'charge.success') {
        const { amount, reference } = event.data;
        const amountInNaira = amount / 100; // Paystack sends amount in kobo

        try {
            // 3. Centralized Authority: Update Treasury atomically
            await treasuryService.processPlatformFee(amountInNaira, 'BAZAAR', reference);
            console.log(`Payment Verified: ${reference} processed successfully.`);
        } catch (error) {
            console.error("Webhook processing error:", error);
            return res.status(500).send('Processing Error');
        }
    }

    // 4. Acknowledge Receipt: Must return 200 to stop Paystack from retrying
    res.sendStatus(200);
});

module.exports = router;
