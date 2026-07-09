//pillarsRoutes.js
const express = require('express');
const router = express.Router();
const { verifyAccess } = require('../middleware/auth');

// Public Pillar: Stage (Live Streaming)
router.get('/stage', verifyAccess(false), (req, res) => res.send("Accessing Stage"));

// High-Value Pillar: Arena (Requires KYC)
router.post('/arena/bet', verifyAccess(true), (req, res) => {
    // Logic for Arena bet goes here
    res.send("Processing bet securely.");
});

module.exports = router;
