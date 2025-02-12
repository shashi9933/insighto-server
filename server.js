const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const corsMiddleware = require('./middleware/cors');

const app = express();
const port = process.env.PORT || 5000;

// Add this before other middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Use custom CORS middleware before routes
app.use(corsMiddleware);

// Remove or comment out the previous cors configuration
// app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads directory statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', require('./routes/api'));

// Add error logging
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});