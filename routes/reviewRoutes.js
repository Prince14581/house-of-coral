const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const apiGateway = require('../middleware/apiGateway');

// Anyone can view reviews
router.get('/:targetId', reviewController.getReviews);

// Users must be authenticated to write reviews
router.post('/', apiGateway('General'), reviewController.addReview);

module.exports = router;
