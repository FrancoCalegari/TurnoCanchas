const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios');
const { requireTenantAdmin } = require('../middleware/auth');

router.post('/registro', usuariosController.register);
router.post('/login', usuariosController.login);
router.get('/perfil', usuariosController.getProfile); // Requiere auth middleware
router.put('/perfil', usuariosController.updateProfile);

router.get('/admin/clientes', requireTenantAdmin, usuariosController.getAdminClientes);

module.exports = router;
