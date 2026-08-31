const { executeQuery } = require('../config/db');

// Obtener mensajes (Admin o Cliente)
const getMensajes = async (req, res) => {
    try {
        let tenantFilter = 'tenant_id = 0';
        if (req.tenant && req.tenant.id) {
            tenantFilter = `tenant_id = ${req.tenant.id}`;
        }
        
        let query = `SELECT * FROM mensajes WHERE ${tenantFilter}`;
        
        // Si es cliente, filtrar solo sus mensajes
        if (req.user && req.user.id && !req.admin) {
            query += ` AND cliente_id = ${req.user.id}`;
        }
        
        query += ' ORDER BY createdAt DESC';
        
        const mensajes = await executeQuery(query);
        res.json({ message: 'Mensajes', data: mensajes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear nuevo mensaje (Admin o Cliente)
const createMensaje = async (req, res) => {
    try {
        const { cliente_id, admin_id, reserva_id, asunto, mensaje } = req.body;
        
        const tenantId = req.tenant && req.tenant.id ? req.tenant.id : 0;
        const safeClienteId = cliente_id ? parseInt(cliente_id) : 'NULL';
        const safeAdminId = admin_id ? parseInt(admin_id) : 'NULL';
        const safeReservaId = reserva_id ? `'${String(reserva_id).replace(/'/g, "''")}'` : 'NULL';
        const safeAsunto = asunto ? `'${String(asunto).replace(/'/g, "''")}'` : 'NULL';
        const safeMensaje = String(mensaje).replace(/'/g, "''");
        
        const query = `
            INSERT INTO mensajes (tenant_id, cliente_id, admin_id, reserva_id, asunto, mensaje)
            VALUES (${tenantId}, ${safeClienteId}, ${safeAdminId}, ${safeReservaId}, ${safeAsunto}, '${safeMensaje}')
        `;
        
        await executeQuery(query);
        res.status(201).json({ message: 'Mensaje enviado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Marcar como leido
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const safeId = parseInt(id);
        const tenantFilter = req.tenant && req.tenant.id ? `AND tenant_id = ${req.tenant.id}` : '';
        
        await executeQuery(`UPDATE mensajes SET leido = TRUE WHERE id = ${safeId} ${tenantFilter}`);
        res.json({ message: 'Mensaje marcado como leído' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getMensajes,
    createMensaje,
    markAsRead
};
