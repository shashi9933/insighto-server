const express = require('express');
const router = express.Router();
const fileController = require('../controllers/FileController');

router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        cors: {
            origin: req.headers.origin,
            allowedOrigins: [
                'http://localhost:3000',
                'https://dataviz-platform.vercel.app'
            ]
        }
    });
});

router.post('/upload', fileController.uploadFile);

module.exports = router;