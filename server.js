const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS configuration - update the configuration
app.use(cors({
    origin: ['https://insighto-client.vercel.app'],  // Only allow your Vercel domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization'
    ],
    credentials: false,
    optionsSuccessStatus: 200
}));

// Add preflight handler
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File Upload Middleware - update configuration
app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    abortOnLimit: true,
    useTempFiles: false, // Process in memory
    parseNested: true,
    debug: true,
    safeFileNames: true,
    preserveExtension: true
}));

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.files) {
        console.log('Files received:', Object.keys(req.files));
    }
    next();
});

// Add request debugging middleware
app.use((req, res, next) => {
    console.log('Request received:', {
        method: req.method,
        path: req.path,
        headers: req.headers,
        files: req.files ? Object.keys(req.files) : 'no files',
        fileDetails: req.files?.file ? {
            name: req.files.file.name,
            size: req.files.file.size,
            mimetype: req.files.file.mimetype
        } : null
    });
    next();
});

// Static files
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api', require('./routes/api'));

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});