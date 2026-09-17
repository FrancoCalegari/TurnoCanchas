const express = require('express');
const router = express.Router();
const pushController = require('../controllers/push');

// Middleware para extraer auth de cualquier tipo (client o admin)
const resolveAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'] || '';
    try {
        if (authHeader.startsWith('Client ')) {
            const token = authHeader.replace('Client ', '');
            const decoded = Buffer.from(token, 'base64').toString('utf8');
            const parts = decoded.split(':');
            const clientId = parseInt(parts[1]);
            req.user = { id: clientId };
            
            // Buscar tenant_id del cliente
            const { executeQuery } = require('../config/db');
            const result = await executeQuery(`SELECT tenant_id FROM clientes WHERE id = ${clientId}`);
            if (result && result.length > 0) {
                req.tenant = { id: result[0].tenant_id };
            }
        } else if (authHeader.startsWith('Tenant ')) {
            const token = authHeader.replace('Tenant ', '');
            const decoded = Buffer.from(token, 'base64').toString('utf8');
            const parts = decoded.split(':');
            req.admin = { id: parseInt(parts[1]) };
            req.tenant = { id: parseInt(parts[1]), slug: parts[2] };
        }
    } catch (e) {
        // Ignorar
    }
    next();
};

router.get('/public-key', pushController.getPublicKey);
router.post('/subscribe', resolveAuth, pushController.subscribe);

module.exports = router;
