const express = require('express');
const router = express.Router();
const { verifyUser } = require('../middleware/auth');
const { sendRequest, acceptRequest } = require('../controllers/heartStringsController');

router.post('/send-request', verifyUser, sendRequest);
router.post('/accept-request', verifyUser, acceptRequest);

module.exports = router;
