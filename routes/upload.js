const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireTenantAdmin } = require('../middleware/auth');
const { executeQuery } = require('../config/db');

// Utilizar memoria para no guardar en disco
const storage = multer.memoryStorage();

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
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: comprobanteFileFilter
});

async function uploadToSpiderweb(fileBuffer, originalName) {
    const API_KEY = process.env.spiderwebapikey;
    const PROJECT_ID = process.env.spiderwebcloudstorageid;

    if (!API_KEY || !PROJECT_ID) {
        throw new Error("API Key o Project ID de Spiderweb no configurado");
    }

    const form = new FormData();
    form.append('files', new Blob([fileBuffer]), originalName);
    
    const res = await fetch(`https://spiderwebargapi.com.ar/api/v1/storage/projects/${PROJECT_ID}/files`, {
        method: 'POST',
        headers: {
            'X-API-KEY': API_KEY
        },
        body: form
    });
    
    const data = await res.json();
    if (!data.success || !data.files || data.files.length === 0) {
        throw new Error("Error al subir a Spiderweb API: " + JSON.stringify(data));
    }
    
    const rawUrl = data.files[0].url;
    return `/api/proxy/image?url=${encodeURIComponent(rawUrl)}`;
}

// Endpoint for uploading logo
router.post('/logo', requireTenantAdmin, upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }
        
        const tenantId = req.tenant ? req.tenant.id : 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(req.file.originalname).toLowerCase();
        const finalName = 'logo-' + tenantId + '-' + uniqueSuffix + ext;

        const fileUrl = await uploadToSpiderweb(req.file.buffer, finalName);
        
        res.json({ message: 'Imagen subida con éxito', url: fileUrl });
    } catch (error) {
        console.error('[Upload Logo] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint for uploading payment comprobante (no admin auth required — public client)
router.post('/comprobante', uploadComprobante.single('comprobante'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo' });
        }

        const reservaId = req.body && req.body.reservaId ? String(req.body.reservaId).replace(/'/g, "''") : null;
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(req.file.originalname).toLowerCase();
        const finalName = 'comprobante-' + (reservaId || 'unknown') + '-' + uniqueSuffix + ext;

        const fileUrl = await uploadToSpiderweb(req.file.buffer, finalName);

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
        console.error('[Upload Comprobante] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
