const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservas');
const { requireTenantAdmin } = require('../middleware/auth');

// TODO: Agregar middlewares de autenticación
router.get('/', reservasController.getAll);
router.get('/admin', requireTenantAdmin, reservasController.getAdminReservas);
router.get('/recientes', requireTenantAdmin, reservasController.getRecent);
router.get('/usuario/:userId', reservasController.getByUser);
router.post('/', reservasController.create);
router.put('/:id/status', requireTenantAdmin, reservasController.updateStatus); // ej: cancelar reserva

module.exports = router;
