const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { listProperty, searchNearby } = require('../controllers/terraHouseController');

// Route to list a new property (Protected)
router.post('/list', verifyToken, listProperty);

// Route to search for properties near a location (Public/Protected)
// Example usage: /api/terrahouse/search?lng=3.5&lat=6.4&maxDistance=5000
router.get('/search', searchNearby);

module.exports = router;
