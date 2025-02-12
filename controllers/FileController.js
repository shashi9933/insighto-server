const { parse } = require('csv-parse/sync');
const { storage } = require('../config/firebase');
const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');

const uploadFile = async (req, res) => {
    try {
        console.log('Upload request received');

        if (!req.files || !req.files.file) {
            return res.status(400).json({
                success: false,
                message: 'No file was uploaded'
            });
        }

        const file = req.files.file;
        const fileBuffer = file.data;

        // Process CSV in memory
        const parsedData = parse(fileBuffer, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        if (parsedData.length === 0) {
            throw new Error('Empty CSV file');
        }

        // Upload to Firebase Storage
        const storageRef = ref(storage, `uploads/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, fileBuffer);
        const downloadURL = await getDownloadURL(storageRef);

        // Send response
        res.json({
            success: true,
            message: 'File processed successfully',
            data: {
                fileUrl: downloadURL,
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