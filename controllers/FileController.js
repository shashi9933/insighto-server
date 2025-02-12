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

const uploadFile = async (req, res) => {
    console.log('Upload request received');

    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const file = req.files.file;

        // Process CSV directly from buffer
        try {
            // Parse CSV data
            const parsedData = await new Promise((resolve, reject) => {
                parse(file.data.toString(), {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true
                }, (err, records) => {
                    if (err) reject(err);
                    else resolve(records);
                });
            });

            if (!parsedData || parsedData.length === 0) {
                throw new Error('No valid data found in CSV');
            }

            // Get column names
            const columns = Object.keys(parsedData[0]);

            // Basic statistics for each numeric column
            const statistics = {};
            columns.forEach(column => {
                const numericValues = parsedData
                    .map(row => parseFloat(row[column]))
                    .filter(val => !isNaN(val));

                if (numericValues.length > 0) {
                    statistics[column] = {
                        min: Math.min(...numericValues),
                        max: Math.max(...numericValues),
                        average: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
                        count: numericValues.length
                    };
                }
            });

            // Send complete response
            return res.json({
                success: true,
                message: 'File processed successfully',
                data: {
                    fileName: file.name,
                    preview: parsedData.slice(0, 5),
                    data: parsedData,
                    totalRows: parsedData.length,
                    columns: columns,
                    statistics: statistics,
                    uploadTime: new Date().toISOString()
                }
            });

        } catch (parseError) {
            console.error('CSV parsing error:', parseError);
            return res.status(400).json({
                success: false,
                message: 'CSV parsing failed',
                details: parseError.message
            });
        }

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            details: error.message
        });
    }
};

module.exports = { uploadFile };