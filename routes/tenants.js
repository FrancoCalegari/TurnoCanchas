// routes/tenants.js
const express = require('express');
const router = express.Router();
const tenantsController = require('../controllers/tenants');
const { requireSuperAdmin } = require('../middleware/auth');

// Rutas públicas
router.post('/register', tenantsController.registerTenant);
router.post('/login', tenantsController.loginTenant);
router.post('/super/login', tenantsController.loginSuperAdmin);

// Rutas protegidas (Super Admin)
router.get('/', requireSuperAdmin, tenantsController.listTenants);
router.put('/:id/approve', requireSuperAdmin, tenantsController.approveTenant);
router.put('/:id/suspend', requireSuperAdmin, tenantsController.suspendTenant);
router.put('/:id/activate', requireSuperAdmin, tenantsController.activateTenant);
router.put('/:id/renew', requireSuperAdmin, tenantsController.renewTenant);
router.put('/renew-all', requireSuperAdmin, tenantsController.renewAllTenants);
router.post('/:id/impersonate', requireSuperAdmin, tenantsController.impersonateTenant);

module.exports = router;
