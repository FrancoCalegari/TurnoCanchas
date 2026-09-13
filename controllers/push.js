const { executeQuery } = require('../config/db');

// Configuración de Web Push
// Debes generar las VAPID keys una sola vez con: npx web-push generate-vapid-keys
// Y configurarlas en las variables de entorno
const webpush = require('web-push');

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:example@yourdomain.org',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn("Faltan VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY en .env para Push Notifications.");
}

const subscribe = async (req, res) => {
    try {
        const { subscription } = req.body;
        const tenantId = req.tenant && req.tenant.id ? req.tenant.id : 0;
        let clienteId = 'NULL';
        let adminId = 'NULL';

        if (req.user && req.user.id && !req.admin) {
            clienteId = req.user.id;
        } else if (req.admin && req.admin.id) {
            adminId = req.admin.id;
        } else {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const subscriptionStr = JSON.stringify(subscription).replace(/'/g, "''");

        // Guardar o actualizar la suscripción
        const query = `
            INSERT INTO push_subscriptions (tenant_id, cliente_id, admin_id, subscription)
            VALUES (${tenantId}, ${clienteId}, ${adminId}, '${subscriptionStr}')
        `;
        
        await executeQuery(query);
        res.status(201).json({ message: 'Suscripción guardada exitosamente' });
    } catch (error) {
        console.error('Error al guardar suscripción push:', error);
        res.status(500).json({ error: 'Error del servidor al guardar la suscripción' });
    }
};

const sendPushToUser = async (tenantId, clienteId, adminId, payload) => {
    try {
        let condition = `tenant_id = ${tenantId}`;
        if (clienteId) {
            condition += ` AND cliente_id = ${clienteId}`;
        } else if (adminId) {
            condition += ` AND admin_id = ${adminId}`;
        }

        const query = `SELECT subscription FROM push_subscriptions WHERE ${condition} ORDER BY createdAt DESC LIMIT 5`;
        const result = await executeQuery(query);

        if (result && result.length > 0) {
            for (const row of result) {
                try {
                    let sub = row.subscription;
                    if (typeof sub === 'string') {
                        sub = JSON.parse(sub);
                    }
                    await webpush.sendNotification(sub, JSON.stringify(payload));
                } catch (err) {
                    console.error('Error enviando push notification (posible suscripción expirada):', err);
                    // Opcional: Eliminar la suscripción expirada
                }
            }
        }
    } catch (error) {
        console.error('Error enviando notificaciones push:', error);
    }
};

module.exports = {
    subscribe,
    sendPushToUser
};
