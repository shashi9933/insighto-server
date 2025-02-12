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
            console.log('No files detected in request');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const file = req.files.file;
        console.log('Processing file:', {
            name: file.name,
            size: file.size,
            mimetype: file.mimetype
        });

        // Process CSV data directly from buffer
        try {
            const fileContent = file.data.toString('utf8');
            console.log('File content length:', fileContent.length);

            const parsedData = await new Promise((resolve, reject) => {
                parse(fileContent, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                    cast: true // Automatically convert strings to numbers where possible
                }, (err, records) => {
                    if (err) {
                        console.error('Parse error:', err);
                        reject(err);
                    } else {
                        console.log('Successfully parsed records:', records.length);
                        resolve(records);
                    }
                });
            });

            if (!parsedData || parsedData.length === 0) {
                throw new Error('No valid data found in CSV');
            }

            // Process the data
            const columns = Object.keys(parsedData[0]);
            console.log('Detected columns:', columns);

            // Send response
            const response = {
                success: true,
                message: 'File processed successfully',
                data: {
                    fileName: file.name,
                    preview: parsedData.slice(0, 5),
                    data: parsedData,
                    totalRows: parsedData.length,
                    columns: columns,
                    uploadTime: new Date().toISOString()
                }
            };

            console.log('Sending response with rows:', parsedData.length);
            return res.json(response);

        } catch (parseError) {
            console.error('CSV parsing error:', parseError);
            return res.status(400).json({
                success: false,
                message: 'CSV parsing failed',
                details: parseError.message || 'Invalid CSV format'
            });
        }

    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            details: error.message
        });
    }
};

module.exports = { uploadFile };