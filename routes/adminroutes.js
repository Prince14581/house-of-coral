// routes/admin.js
const express = require('express');
const router = express.Router();
const Reconciliation = require('../models/Reconciliation');

// Fetch all unresolved discrepancies
router.get('/discrepancies', async (req, res) => {
    try {
        const issues = await Reconciliation.find({ 
            status: { $in: ['DISCREPANCY', 'MISSING_INTERNAL', 'MISSING_EXTERNAL'] } 
        }).sort({ processedAt: -1 });
        res.json(issues);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch issues" });
    }
});

// Update discrepancy status (e.g., to 'RESOLVED')
router.post('/resolve-discrepancy/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        await Reconciliation.findByIdAndUpdate(id, { 
            status: 'RESOLVED',
            resolutionNote: note,
            resolvedAt: new Date()
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Resolution failed" });
    }
});

module.exports = router;
