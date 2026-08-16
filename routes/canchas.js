const express = require('express');
const router = express.Router();
const canchasController = require('../controllers/canchas');

// TODO: Agregar middlewares de autenticación / roles (ej. solo Admin puede crear/editar/eliminar)
router.get('/', canchasController.getAll);
router.get('/:id', canchasController.getById);
router.post('/', canchasController.create);
router.put('/:id', canchasController.update);
router.delete('/:id', canchasController.deleteCancha);

module.exports = router;
