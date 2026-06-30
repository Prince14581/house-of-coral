const express = require('express');
const router = express.Router();
const bazaarController = require('../controllers/bazaarController');

router.post('/add', bazaarController.createItem);
module.exports = router;
