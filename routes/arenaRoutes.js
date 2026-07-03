const express = require('express');
const router = express.Router();
const { verifyUser } = require('../middleware/auth');
const { placeBet } = require('../controllers/arenaController');

// POST /api/arena/place-bet
router.post('/place-bet', verifyUser, placeBet);

module.exports = router;
