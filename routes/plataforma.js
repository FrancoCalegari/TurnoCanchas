const express = require('express');
const router = express.Router();
const plataformaController = require('../controllers/plataforma');
const { requireSuperAdmin } = require('../middleware/auth');

router.get('/', plataformaController.getStatus);
router.put('/', plataformaController.updateStatus);

// Rutas de información/branding de la plataforma
router.get('/info', plataformaController.getInfo);
router.put('/info', requireSuperAdmin, plataformaController.updateInfo);

module.exports = router;
