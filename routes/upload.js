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

// Storage for comprobantes
const comprobanteStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const reservaId = req.body ? (req.body.reservaId || 'unknown') : 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'comprobante-' + reservaId + '-' + uniqueSuffix + ext);
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

// Allow images and PDFs for comprobantes
const comprobanteFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes o PDF'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

const uploadComprobante = multer({
    storage: comprobanteStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: comprobanteFileFilter
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

// Endpoint for uploading payment comprobante (no admin auth required — public client)
const { executeQuery } = require('../config/db');

router.post('/comprobante', uploadComprobante.single('comprobante'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo' });
        }

        const reservaId = req.body && req.body.reservaId ? String(req.body.reservaId).replace(/'/g, "''") : null;
        const fileUrl = '/uploads/' + req.file.filename;

        // Update the reserva with the comprobante URL and mark as comprobante_enviado
        if (reservaId) {
            try {
                await executeQuery(
                    `UPDATE reservas SET comprobante_url = '${fileUrl}', estado = 'comprobante_enviado' WHERE id = '${reservaId}'`
                );
            } catch (dbErr) {
                console.error('[Upload Comprobante] DB error:', dbErr.message);
                // Still return success even if DB update fails; the file is saved
            }
        }

        res.json({ message: 'Comprobante subido con éxito', url: fileUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

