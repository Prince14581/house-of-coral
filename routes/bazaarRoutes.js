const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const handleTransactionFee = require('../middleware/treasuryMiddleware');
const { purchaseProduct } = require('../controllers/bazaarController');

// Route: POST /api/bazaar/purchase
// 1. Authenticate user -> 2. Process 10% fee -> 3. Complete purchase
router.post('/purchase', verifyToken, handleTransactionFee, purchaseProduct);

module.exports = router;
