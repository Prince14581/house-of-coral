const express = require('express');
const router = express.Router();
const globalLinkController = require('../controllers/globalLinkController');
const { verifyUser } = require('../middleware/auth');

// Global connections: cross-pillar linking and messaging
router.get('/connections', verifyUser, globalLinkController.getUserConnections);
router.post('/connect', verifyUser, globalLinkController.createConnection);
router.post('/disconnect', verifyUser, globalLinkController.removeConnection);
router.get('/notifications', verifyUser, globalLinkController.getNotifications);
router.post('/broadcast', verifyUser, globalLinkController.broadcastMessage);

module.exports = router;
