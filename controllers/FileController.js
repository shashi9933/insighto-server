const { parse } = require('csv-parse');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');

const uploadFile = async (req, res) => {
    console.log('Upload endpoint hit:', {
        method: req.method,
        contentType: req.headers['content-type'],
        hasFiles: !!req.files,
        fileKeys: req.files ? Object.keys(req.files) : []
    });

    try {
        if (!req.files || !req.files.file) {
            console.log('No file in request:', req.files);
            return res.status(400).json({
                success: false,
                message: 'No file was uploaded',
                details: 'Please select a file before uploading'
            });
        }

        const file = req.files.file;
        console.log('File received:', {
            name: file.name,
            size: file.size,
            mimetype: file.mimetype,
            md5: file.md5
        });

        // Process the file directly from the buffer
        try {
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

            console.log('CSV parsing successful:', {
                rowCount: parsedData.length,
                columns: parsedData.length > 0 ? Object.keys(parsedData[0]) : []
            });

            // Send response
            return res.json({
                success: true,
                message: 'File processed successfully',
                data: {
                    fileName: file.name,
                    preview: parsedData.slice(0, 5),
                    data: parsedData,
                    totalRows: parsedData.length,
                    columns: Object.keys(parsedData[0] || {})
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
        console.error('Upload handler error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during upload',
            details: error.message
        });
    }
};

module.exports = { uploadFile };