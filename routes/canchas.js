const express = require('express');
const router = express.Router();
const canchasController = require('../controllers/canchas');
const { requireTenantAdmin } = require('../middleware/auth');

// TODO: Agregar middlewares de autenticación / roles (ej. solo Admin puede crear/editar/eliminar)
router.get('/', canchasController.getAll);
router.get('/:id', canchasController.getById);
router.post('/', requireTenantAdmin, canchasController.create);
router.put('/:id', requireTenantAdmin, canchasController.update);
router.delete('/:id', requireTenantAdmin, canchasController.deleteCancha);

module.exports = router;
