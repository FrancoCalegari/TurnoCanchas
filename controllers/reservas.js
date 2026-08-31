const { executeQuery } = require('../config/db');
const { notifyReservationCreated, notifyReservationStatusChanged } = require('../utils/notifications');

const getAll = async (req, res) => {
    try {
        const { fecha } = req.query;
        let tenantFilter = '';
        if (req.query.tenant) {
            const safeSlug = String(req.query.tenant).replace(/'/g, "''");
            const tRes = await executeQuery(`SELECT id FROM tenants WHERE slug = '${safeSlug}'`);
            if (tRes && tRes.length > 0) {
                tenantFilter = `tenant_id = ${tRes[0].id}`;
            }
        }

        let conditions = [];
        if (fecha) conditions.push(`fecha = '${String(fecha).replace(/'/g, "''")}'`);
        if (tenantFilter) conditions.push(tenantFilter);

        let query = 'SELECT * FROM reservas';
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        const reservas = await executeQuery(query);
        res.json({ message: 'Listado de reservas', data: reservas });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin: todas las reservas con filtros opcionales
const getAdminReservas = async (req, res) => {
    try {
        const { search, estado, desde, hasta, limit = 100 } = req.query;
        let conditions = [];
        
        if (req.tenant && req.tenant.id) {
            conditions.push(`r.tenant_id = ${req.tenant.id}`);
        }

        if (search) {
            const s = String(search).replace(/'/g, "''");
            conditions.push(`(r.cliente ILIKE '%${s}%' OR r.id ILIKE '%${s}%' OR CAST(r.canchaId AS TEXT) ILIKE '%${s}%')`);
        }
        if (estado && estado !== 'todos') {
            const safeEstado = String(estado).replace(/'/g, "''");
            conditions.push(`r.estado = '${safeEstado}'`);
        }
        if (desde) {
            const safeDesde = String(desde).replace(/'/g, "''");
            conditions.push(`r.fecha >= '${safeDesde}'`);
        }
        if (hasta) {
            const safeHasta = String(hasta).replace(/'/g, "''");
            conditions.push(`r.fecha <= '${safeHasta}'`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const safeLimit = parseInt(limit) || 100;

        const query = `
            SELECT r.*, 
                   c.nombre AS canchaName,
                   cl.nombre AS clienteNombre,
                   cl.telefono AS clienteTelefono,
                   cl.email AS clienteEmail
            FROM reservas r
            LEFT JOIN canchas c ON r.canchaId = c.id
            LEFT JOIN clientes cl ON r.cliente_id = cl.id
            ${where}
            ORDER BY r.fecha DESC, r.hora DESC
            LIMIT ${safeLimit}
        `;

        const result = await executeQuery(query);
        res.json({ message: 'Reservas admin', data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const safeUserId = String(userId).replace(/'/g, "''");
        
        let query;
        if (!isNaN(userId) && userId.trim() !== '') {
            query = `SELECT * FROM reservas WHERE cliente = '${safeUserId}' OR cliente_id = ${parseInt(userId)}`;
        } else {
            query = `SELECT * FROM reservas WHERE cliente = '${safeUserId}'`;
        }
        
        const result = await executeQuery(query);
        res.json({ message: `Reservas del usuario ${userId}`, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { canchaId, fecha, hora, cliente, cliente_id, duracion, precio, estado } = req.body;
        
        // Generate a random ID like 'RES-XYZ123'
        const id = 'RES-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        
        const safeCanchaId = parseInt(canchaId);
        const safeFecha = String(fecha).replace(/'/g, "''");
        const safeHora = String(hora).replace(/'/g, "''");
        const safeCliente = String(cliente).replace(/'/g, "''");
        const safeDuracion = parseInt(duracion) || 60;
        const safePrecio = parseInt(precio) || 0;
        
        const safeClienteId = cliente_id ? parseInt(cliente_id) : 'NULL';
        const finalEstado = estado ? String(estado).replace(/'/g, "''") : 'por confirmar';

        // Get tenant_id from cancha
        const canchaRes = await executeQuery(`SELECT tenant_id FROM canchas WHERE id = ${safeCanchaId}`);
        const tenantId = (canchaRes && canchaRes.length > 0) ? canchaRes[0].tenant_id : 0;

        const query = `
            INSERT INTO reservas (id, canchaId, fecha, hora, cliente, cliente_id, duracion, precio, estado, tenant_id) 
            VALUES ('${id}', ${safeCanchaId}, '${safeFecha}', '${safeHora}', '${safeCliente}', ${safeClienteId}, ${safeDuracion}, ${safePrecio}, '${finalEstado}', ${tenantId})
        `;
        
        await executeQuery(query);
        
        // Return the created ID as frontend expects it
        res.status(201).json({ 
            message: 'Reserva creada con éxito', 
            data: { id, canchaId: safeCanchaId, fecha: safeFecha, hora: safeHora, cliente: safeCliente, cliente_id: safeClienteId !== 'NULL' ? safeClienteId : null, duracion: safeDuracion, precio: safePrecio }
        });

        // Trigger Notification
        if (safeClienteId !== 'NULL') {
            try {
                const cliRes = await executeQuery(`SELECT email, telefono, nombre FROM clientes WHERE id = ${safeClienteId}`);
                if (cliRes && cliRes.length > 0) {
                    await notifyReservationCreated({
                        id, fecha: safeFecha, hora: safeHora, precio: safePrecio, cliente: safeCliente, estado: finalEstado
                    }, cliRes[0]);
                }
            } catch (notiErr) {
                console.error('Error enviando notificación (creación):', notiErr);
            }
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const safeStatus = String(status).replace(/'/g, "''");
        const tenantFilter = req.tenant && req.tenant.id ? `AND tenant_id = ${req.tenant.id}` : '';
        await executeQuery(`UPDATE reservas SET estado = '${safeStatus}' WHERE id = '${id}' ${tenantFilter}`);
        
        res.json({ message: `Estado de la reserva ${id} actualizado a ${status}` });

        // Trigger Notification
        try {
            const resData = await executeQuery(`
                SELECT r.fecha, r.hora, r.cliente, c.email, c.telefono, c.nombre 
                FROM reservas r 
                LEFT JOIN clientes c ON r.cliente_id = c.id 
                WHERE r.id = '${id}'
            `);
            if (resData && resData.length > 0) {
                await notifyReservationStatusChanged({
                    id, fecha: resData[0].fecha, hora: resData[0].hora, cliente: resData[0].cliente
                }, resData[0], status);
            }
        } catch (notiErr) {
            console.error('Error enviando notificación (update):', notiErr);
        }
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRecent = async (req, res) => {
    try {
        const tenantFilter = req.tenant && req.tenant.id ? `WHERE tenant_id = ${req.tenant.id}` : '';
        // Obtenemos las últimas 50 reservas
        const result = await executeQuery(`SELECT * FROM reservas ${tenantFilter} ORDER BY createdAt DESC LIMIT 50`);
        res.json({ message: 'Reservas recientes', data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const cancelByClient = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId; // inyectado por requireClientAuth

        // Verificar que la reserva pertenezca al cliente
        const result = await executeQuery(
            `SELECT * FROM reservas WHERE id = '${String(id).replace(/'/g, "''")}' AND cliente_id = ${clientId}`
        );
        if (!result || result.length === 0) {
            return res.status(403).json({ error: 'No tenés permiso para cancelar esta reserva o no existe' });
        }

        const reserva = result[0];

        // Verificar que la reserva sea futura
        const fechaHora = new Date(`${reserva.fecha.toISOString ? reserva.fecha.toISOString().split('T')[0] : String(reserva.fecha).split('T')[0]}T${reserva.hora}`);
        if (fechaHora < new Date()) {
            return res.status(400).json({ error: 'No se puede cancelar una reserva pasada' });
        }

        await executeQuery(`UPDATE reservas SET estado = 'cancelada' WHERE id = '${String(id).replace(/'/g, "''")}'`);
        res.json({ message: 'Reserva cancelada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAll,
    getAdminReservas,
    getByUser,
    create,
    updateStatus,
    getRecent,
    cancelByClient
};

