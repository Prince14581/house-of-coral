// services/vtuService.js
const axios = require('axios');
const Ledger = require('../models/Ledger');

exports.purchaseVTU = async (userId, phoneNumber, amount, serviceType) => {
    // 1. External API Call to VTU Aggregator
    try {
        const response = await axios.post(process.env.VTU_API_URL, {
            phone: phoneNumber,
            amount: amount,
            service: serviceType
        }, { headers: { 'Authorization': `Bearer ${process.env.VTU_API_KEY}` } });

        if (response.data.status === 'success') {
            // 2. Log successful transaction to Ledger
            await Ledger.create({
                userId,
                amount,
                pillar: 'BAZAAR',
                status: 'COMPLETED',
                txRef: response.data.txId
            });
            return { success: true, txId: response.data.txId };
        }
        throw new Error("Provider rejected transaction");
    } catch (err) {
        throw new Error("VTU Transaction Failed: " + err.message);
    }
};
