const { parse } = require('csv-parse');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');

const uploadFile = async (req, res) => {
    console.log('Upload request received:', {
        files: req.files ? Object.keys(req.files) : 'no files',
        body: req.body,
        headers: req.headers
    });

    try {
        // File existence check
        if (!req.files || !req.files.file) {
            console.log('No files were uploaded');
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

        // Process CSV directly from buffer
        const parseCSV = (buffer) => {
            return new Promise((resolve, reject) => {
                parse(buffer, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true
                }, (err, records) => {
                    if (err) reject(err);
                    else resolve(records);
                });
            });
        };

        // Parse the CSV data from the file buffer
        const parsedData = await parseCSV(file.data);

        if (parsedData.length === 0) {
            throw new Error('Empty CSV file');
        }

        // Send response with parsed data
        res.json({
            success: true,
            message: 'File processed successfully',
            data: {
                preview: parsedData.slice(0, 5),
                data: parsedData,
                totalRows: parsedData.length,
                columns: Object.keys(parsedData[0])
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = { uploadFile };