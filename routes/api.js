const express = require('express');
const router = express.Router();
const fileController = require('../controllers/FileController');

router.post('/upload', fileController.uploadFile);

module.exports = router;