const express = require('express');
const router = express.Router();
const heartStringsController = require('../controllers/heartStringsController');
const apiGateway = require('../middleware/apiGateway');

router.use(apiGateway('HeartStrings'));

router.post('/friend/add', heartStringsController.addFriend);
router.get('/recommendations', heartStringsController.getRecommendations);
router.patch('/settings', heartStringsController.updateSettings);

module.exports = router;
