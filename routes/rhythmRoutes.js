// routes/rhythm.js
const express = require('express');
const router = express.Router();
const pillarGuard = require('../middleware/pillarGuard');
const { getLiveContent } = require('../services/rhythmService');

router.use(pillarGuard); // All Rhythm Hub routes are gated

router.get('/now-playing', async (req, res) => {
    try {
        const content = await getLiveContent();
        res.json({ success: true, content });
    } catch (err) {
        res.status(500).json({ error: "Rhythm Hub Unavailable" });
    }
});

module.exports = router;
