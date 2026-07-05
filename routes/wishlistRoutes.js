const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const apiGateway = require('../middleware/apiGateway');

router.use(apiGateway('General')); // Accessible by any authenticated user

router.get('/', wishlistController.getWishlist);
router.post('/toggle', wishlistController.toggleItem);

module.exports = router;
