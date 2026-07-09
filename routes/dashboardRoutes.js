// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { getGlobalDashboard } = require('../services/dashboardService');

router.get('/data', async (req, res) => {
    try {
        const data = await getGlobalDashboard(req.user.id);
        res.json({ success: true, ...data });
    } catch (err) {
        res.status(500).json({ error: "Dashboard sync failed" });
    }
});

module.exports = router;
