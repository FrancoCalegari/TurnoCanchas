const { executeQuery } = require('../config/db');
const pushController = require('./push');

// Obtener mensajes (Admin o Cliente) agrupados o historial completo
const getMensajes = async (req, res) => {
    try {
        let tenantFilter = 'tenant_id = 0';
        if (req.tenant && req.tenant.id) {
            tenantFilter = `tenant_id = ${req.tenant.id}`;
        }
        
        // Si se pide de un cliente específico (vista admin)
        const targetClienteId = req.query.cliente_id;
        
        let query = `
            SELECT m.*, c.nombre as cliente_nombre 
            FROM mensajes m
            LEFT JOIN clientes c ON m.cliente_id = c.id
            WHERE m.${tenantFilter}
        `;
        
        if (req.user && req.user.id && !req.admin) {
            // Cliente normal ve solo sus mensajes
            query += ` AND m.cliente_id = ${req.user.id}`;
        } else if (targetClienteId) {
            // Admin ve mensajes de un cliente específico
            query += ` AND m.cliente_id = ${parseInt(targetClienteId)}`;
        }
        
        query += ' ORDER BY m.createdAt ASC'; // Orden cronológico para el chat
        
        const mensajes = await executeQuery(query);

        // Si es Admin y NO mandó un cliente_id, devolver lista de chats (sesiones)
        if (req.admin && !targetClienteId) {
            const chatSessionsQuery = `
                SELECT 
                    m.cliente_id, 
                    c.nombre as cliente_nombre, 
                    MAX(m.createdAt) as last_message_time,
                    SUM(CASE WHEN m.leido = FALSE AND m.sender_type = 'cliente' THEN 1 ELSE 0 END) as unread_count
                FROM mensajes m
                JOIN clientes c ON m.cliente_id = c.id
                WHERE m.${tenantFilter}
                GROUP BY m.cliente_id, c.nombre
                ORDER BY last_message_time DESC
            `;
            const sessions = await executeQuery(chatSessionsQuery);
            return res.json({ message: 'Sesiones de chat', data: sessions });
        }

        res.json({ message: 'Mensajes', data: mensajes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear nuevo mensaje (Admin o Cliente)
const createMensaje = async (req, res) => {
    try {
        const { cliente_id, admin_id, reserva_id, asunto, mensaje, sender_type, file_url } = req.body;
        
        const tenantId = req.tenant && req.tenant.id ? req.tenant.id : 0;
        
        // Si el request es de un cliente, forzar sus datos
        let safeClienteId = cliente_id ? parseInt(cliente_id) : 'NULL';
        let safeAdminId = admin_id ? parseInt(admin_id) : 'NULL';
        let finalSenderType = sender_type === 'admin' ? 'admin' : 'cliente';
        
        if (req.user && req.user.id && !req.admin) {
            safeClienteId = req.user.id;
            finalSenderType = 'cliente';
        } else if (req.admin && req.admin.id) {
            safeAdminId = req.admin.id;
            finalSenderType = 'admin';
        }

        const safeReservaId = reserva_id ? `'${String(reserva_id).replace(/'/g, "''")}'` : 'NULL';
        const safeAsunto = asunto ? `'${String(asunto).replace(/'/g, "''")}'` : 'NULL';
        const safeMensaje = String(mensaje || '').replace(/'/g, "''");
        const safeFileUrl = file_url ? `'${String(file_url).replace(/'/g, "''")}'` : 'NULL';
        
        const query = `
            INSERT INTO mensajes (tenant_id, cliente_id, admin_id, reserva_id, asunto, mensaje, sender_type, file_url)
            VALUES (${tenantId}, ${safeClienteId}, ${safeAdminId}, ${safeReservaId}, ${safeAsunto}, '${safeMensaje}', '${finalSenderType}', ${safeFileUrl})
            RETURNING *;
        `;
        
        const insertRes = await executeQuery(query);
        const newMessage = Array.isArray(insertRes) ? insertRes[0] : null;

        // Disparar Notificación Push
        try {
            const payload = {
                title: finalSenderType === 'admin' ? 'Mensaje del Complejo' : 'Nuevo mensaje de cliente',
                body: safeMensaje || 'Archivo adjunto',
                icon: '/icons/icon-192x192.png'
            };
            
            if (finalSenderType === 'cliente') {
                // Notificar a admins (admin_id = null o específico)
                // Se envía a todos los admins del tenant_id (adminId=NULL en sendPushToUser no filtra admin específico)
                await pushController.sendPushToUser(tenantId, null, null, payload);
            } else {
                // Notificar al cliente
                await pushController.sendPushToUser(tenantId, safeClienteId, null, payload);
            }
        } catch(pushErr) {
            console.error('Push notification falló:', pushErr.message);
        }
        
        res.status(201).json({ message: 'Mensaje enviado exitosamente', data: newMessage });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Marcar como leido
const markAsRead = async (req, res) => {
    try {
        const tenantFilter = req.tenant && req.tenant.id ? `AND tenant_id = ${req.tenant.id}` : '';
        
        if (req.params.id === 'client') {
            // Marcar todos los mensajes de un cliente como leidos por el admin
            const { cliente_id } = req.body;
            if (!cliente_id) return res.status(400).json({error: 'cliente_id requerido'});
            await executeQuery(`UPDATE mensajes SET leido = TRUE WHERE cliente_id = ${parseInt(cliente_id)} AND sender_type = 'cliente' ${tenantFilter}`);
        } else {
            const safeId = parseInt(req.params.id);
            await executeQuery(`UPDATE mensajes SET leido = TRUE WHERE id = ${safeId} ${tenantFilter}`);
        }

        res.json({ message: 'Mensajes marcados como leídos' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getMensajes,
    createMensaje,
    markAsRead
};
