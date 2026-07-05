const express = require('express');
const router = express.Router();
const stageController = require('../controllers/stageController');
const apiGateway = require('../middleware/apiGateway');

router.use(apiGateway('Stage'));

router.post('/create', stageController.createStream);
// Future: router.get('/monitor/:streamId', stageController.getStreamHealth);

module.exports = router;
