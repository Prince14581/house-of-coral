const express = require('express');
const router = express.Router();
const terraHouseController = require('../controllers/terraHouseController');
const { verifyUser } = require('../middleware/auth');

router.post('/list', verifyUser, terraHouseController.listProperty);
router.post('/purchase', verifyUser, terraHouseController.purchaseProperty);

module.exports = router;
