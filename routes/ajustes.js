const express = require('express');
const router = express.Router();
const ajustesController = require('../controllers/ajustes');
const { requireTenantAdmin } = require('../middleware/auth');

router.get('/', ajustesController.getAjustes);
router.put('/', requireTenantAdmin, ajustesController.updateAjustes);

module.exports = router;
