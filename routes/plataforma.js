const express = require('express');
const router = express.Router();
const plataformaController = require('../controllers/plataforma');
const { requireSuperAdmin } = require('../middleware/auth');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'plataforma-logo-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('El archivo no es una imagen permitida'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

router.get('/', plataformaController.getStatus);
router.put('/', plataformaController.updateStatus);

// Rutas de información/branding de la plataforma
router.get('/info', plataformaController.getInfo);
router.put('/info', requireSuperAdmin, plataformaController.updateInfo);

router.post('/logo', requireSuperAdmin, upload.single('logo'), plataformaController.uploadLogo);

module.exports = router;
