// routes/media.js
const express = require('express');
const router = express.Router();
const pillarGuard = require('../middleware/pillarGuard');
const { upload } = require('../services/uploadService');

// Require authentication and pillar check
router.post('/upload', pillarGuard, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Upload failed" });
    
    // Return the URL for the frontend to save in the user/content profile
    res.json({ url: req.file.location });
});

module.exports = router;
