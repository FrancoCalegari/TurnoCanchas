const express = require('express');
const router = express.Router();
const plataformaController = require('../controllers/plataforma');

router.get('/', plataformaController.getStatus);
router.put('/', plataformaController.updateStatus);

module.exports = router;
