// routes/rubros.js
const express = require('express');
const router = express.Router();
const rubrosController = require('../controllers/rubros');
const { requireSuperAdmin } = require('../middleware/auth');

// Todas las rutas de rubros requieren Super Admin o pueden ser públicas las lecturas si se desea, 
// pero en este caso solo el super admin administra, y la lista la puede ver el publico para registrarse.
router.get('/', rubrosController.listRubros);
router.get('/:id', rubrosController.getRubro);

router.post('/', requireSuperAdmin, rubrosController.createRubro);
router.put('/:id', requireSuperAdmin, rubrosController.updateRubro);
router.delete('/:id', requireSuperAdmin, rubrosController.deleteRubro);

module.exports = router;
