const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireTenantAdmin } = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Safe filename with tenant ID and timestamp
        const tenantId = req.tenant ? req.tenant.id : 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'logo-' + tenantId + '-' + uniqueSuffix + ext);
    }
});

// Allow only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('El archivo no es una imagen permitida'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// Endpoint for uploading logo
router.post('/logo', requireTenantAdmin, upload.single('logo'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }
        
        // Return the public URL for the uploaded file
        // E.g., /uploads/logo-1-123456789.png
        const fileUrl = '/uploads/' + req.file.filename;
        
        res.json({ message: 'Imagen subida con éxito', url: fileUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
