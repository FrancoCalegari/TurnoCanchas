// routes/tenants.js
const express = require('express');
const router = express.Router();
const tenantsController = require('../controllers/tenants');
const { requireSuperAdmin, requireTenantAdmin } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiters');

// Registro y Login
router.post('/register', tenantsController.registerTenant);
router.post('/login', loginLimiter, tenantsController.loginTenant);
router.post('/super/login', loginLimiter, tenantsController.loginSuperAdmin);

// Rutas protegidas (Super Admin)
router.get('/stats', requireSuperAdmin, tenantsController.getTenantStats);
router.post('/super-create', requireSuperAdmin, tenantsController.superCreateTenant);
router.get('/', requireSuperAdmin, tenantsController.listTenants);
router.put('/:id/approve', requireSuperAdmin, tenantsController.approveTenant);
router.put('/:id/suspend', requireSuperAdmin, tenantsController.suspendTenant);
router.put('/:id/activate', requireSuperAdmin, tenantsController.activateTenant);
router.put('/:id/renew', requireSuperAdmin, tenantsController.renewTenant);
router.put('/renew-all', requireSuperAdmin, tenantsController.renewAllTenants);
router.put('/:id', requireSuperAdmin, tenantsController.updateTenant);
router.post('/:id/impersonate', requireSuperAdmin, tenantsController.impersonateTenant);
router.delete('/:id', requireSuperAdmin, tenantsController.deleteTenant);

module.exports = router;
