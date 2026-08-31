const express = require('express');
const router = express.Router();
const mensajesController = require('../controllers/mensajes');
const { requireTenantAdmin } = require('../middleware/auth');

// GET /api/mensajes - Solo admin del tenant puede ver todos los mensajes
router.get('/', requireTenantAdmin, mensajesController.getMensajes);

// POST /api/mensajes - Público: clientes o admin pueden enviar mensajes
// El controlador usa req.tenant si existe (inyectado por middleware en server.js)
router.post('/', mensajesController.createMensaje);

// PUT /api/mensajes/:id/read - Admin only
router.put('/:id/read', requireTenantAdmin, mensajesController.markAsRead);

module.exports = router;

