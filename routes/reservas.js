const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservas');

// TODO: Agregar middlewares de autenticación
router.get('/', reservasController.getAll);
router.get('/recientes', reservasController.getRecent);
router.get('/usuario/:userId', reservasController.getByUser);
router.post('/', reservasController.create);
router.put('/:id', reservasController.updateStatus); // ej: cancelar reserva

module.exports = router;
