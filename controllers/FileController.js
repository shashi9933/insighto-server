const multer = require('multer');
const path = require('path');
const { parse } = require('csv-parse');
const fs = require('fs');
const db = require('../config/database');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

// Create multer upload instance
const uploadMiddleware = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'text/csv') {
            return cb(new Error('Only CSV files are allowed'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
}).single('file');

const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(parse({ columns: true, skip_empty_lines: true }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
};

// Export only one version of uploadFile
exports.uploadFile = (req, res) => {
    uploadMiddleware(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({ message: err.message });
        }

        try {
            if (!req.file) {
                console.error('No file received');
                return res.status(400).json({ message: 'No file uploaded' });
            }

            console.log('File received:', req.file);

            // Parse CSV file
            const parsedData = await parseCSV(req.file.path);

            // Store file information in database
            db.run(
                'INSERT INTO files (filename) VALUES (?)',
                [req.file.filename],
                function (err) {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ message: 'Database error' });
                    }

                    // Return preview data
                    const response = {
                        message: 'File uploaded successfully',
                        fileId: this.lastID,
                        preview: parsedData.slice(0, 5),
                        data: parsedData,
                        totalRows: parsedData.length,
                    };

                    console.log('Sending response:', response);
                    res.json(response);
                }
            );
        } catch (error) {
            console.error('Processing error:', error);
            res.status(500).json({ message: error.message });
        }
    });
};