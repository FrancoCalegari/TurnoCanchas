const express = require('express');
const router = express.Router();
const ajustesController = require('../controllers/ajustes');

router.get('/', ajustesController.getAjustes);
router.put('/', ajustesController.updateAjustes);

module.exports = router;
