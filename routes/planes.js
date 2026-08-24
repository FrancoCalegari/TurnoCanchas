const express = require('express');
const router = express.Router();
const planesController = require('../controllers/planes');
const { requireSuperAdmin } = require('../middleware/auth');

// Rutas públicas
router.get('/', planesController.getPlanes);

// Rutas protegidas (solo Super Admin)
router.post('/', requireSuperAdmin, planesController.createPlan);
router.put('/:id', requireSuperAdmin, planesController.updatePlan);
router.delete('/:id', requireSuperAdmin, planesController.deletePlan);

module.exports = router;
