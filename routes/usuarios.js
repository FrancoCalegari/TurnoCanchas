const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios');
const { requireTenantAdmin } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiters');

router.post('/registro', usuariosController.register);
router.post('/login', loginLimiter, usuariosController.login);
router.get('/perfil', usuariosController.getProfile); // Requiere auth middleware
router.put('/perfil', usuariosController.updateProfile);

router.get('/admin/clientes', requireTenantAdmin, usuariosController.getAdminClientes);
router.delete('/admin/clientes/:id', requireTenantAdmin, usuariosController.deleteCliente);
router.post('/admin/clientes/:id/reset-password', requireTenantAdmin, usuariosController.adminResetPassword);

module.exports = router;
