const multer = require('multer');
const path = require('path');
const { parse } = require('csv-parse');
const fs = require('fs');
const db = require('../config/database');

const uploadFile = async (req, res) => {
    try {
        // File existence check
        if (!req.files || !req.files.file) {
            return res.status(400).json({
                success: false,
                message: 'No file was uploaded',
                details: 'Please select a file before uploading'
            });
        }

        const file = req.files.file;

        // File type validation
        if (!file.name.endsWith('.csv')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type',
                details: 'Please upload a CSV file only'
            });
        }

        // File size validation (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            return res.status(400).json({
                success: false,
                message: 'File too large',
                details: 'Maximum file size is 5MB'
            });
        }

        const uploadsDir = path.join(__dirname, '../uploads');

        // Create uploads directory if it doesn't exist
        try {
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
        } catch (mkdirError) {
            console.error('Directory creation error:', mkdirError);
            return res.status(500).json({
                success: false,
                message: 'Server configuration error',
                details: 'Could not create upload directory'
            });
        }

        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(uploadsDir, fileName);

        // Move file to uploads directory
        try {
            await file.mv(filePath);
        } catch (moveError) {
            console.error('File move error:', moveError);
            return res.status(500).json({
                success: false,
                message: 'File upload failed',
                details: 'Error saving file to server'
            });
        }

        // Parse CSV file
        try {
            const parsedData = await parseCSV(filePath);

            if (parsedData.length === 0) {
                throw new Error('Empty CSV file');
            }

            // Validate CSV structure
            const headers = Object.keys(parsedData[0]);
            if (headers.length === 0) {
                throw new Error('No columns found in CSV');
            }

            // Store file information in database
            db.run(
                'INSERT INTO files (filename, upload_date) VALUES (?, datetime("now"))',
                [fileName],
                function (dbError) {
                    if (dbError) {
                        console.error('Database error:', dbError);
                        return res.status(500).json({
                            success: false,
                            message: 'Database error',
                            details: 'Failed to record file information'
                        });
                    }

                    // Success response
                    const response = {
                        success: true,
                        message: 'File uploaded and processed successfully',
                        data: {
                            fileId: this.lastID,
                            fileName: fileName,
                            preview: parsedData.slice(0, 5),
                            data: parsedData,
                            totalRows: parsedData.length,
                            columns: headers,
                            uploadTime: new Date().toISOString()
                        }
                    };

                    console.log('Upload successful:', {
                        fileId: this.lastID,
                        fileName: fileName,
                        rowCount: parsedData.length
                    });

                    res.json(response);
                }
            );

        } catch (parseError) {
            console.error('CSV parsing error:', parseError);
            // Clean up the uploaded file if parsing fails
            fs.unlinkSync(filePath);
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
            details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
    }
};

const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        let rowCount = 0;
        const maxRows = 100000; // Limit to prevent memory issues

        fs.createReadStream(filePath)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                trim: true
            }))
            .on('data', (data) => {
                rowCount++;
                if (rowCount > maxRows) {
                    reject(new Error(`File exceeds maximum row limit of ${maxRows}`));
                    return;
                }
                results.push(data);
            })
            .on('error', (error) => {
                reject(new Error(`CSV parsing error: ${error.message}`));
            })
            .on('end', () => {
                if (results.length === 0) {
                    reject(new Error('The CSV file is empty or contains no valid data'));
                } else {
                    resolve(results);
                }
            });
    });
};

module.exports = {
    uploadFile,
    parseCSV
};