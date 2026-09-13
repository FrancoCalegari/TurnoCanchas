const { executeQuery, sqlEscape } = require('../config/db');
const { notifyReservationCreated, notifyReservationStatusChanged } = require('../utils/notifications');

const parseHoraToMinutes = (horaStr) => {
    if (!horaStr) return 0;
    const parts = horaStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || 0, 10);
};

const getAll = async (req, res) => {
    try {
        const { fecha } = req.query;
        let tenantFilter = '';
        if (req.query.tenant) {
            const safeSlug = req.query.tenant;
            const tRes = await executeQuery(`SELECT id FROM tenants WHERE slug = ${sqlEscape(safeSlug)}`);
            if (tRes && tRes.length > 0) {
                tenantFilter = `tenant_id = ${sqlEscape(tRes[0].id)}`;
            }
        }

        let conditions = [];
        if (fecha) conditions.push(`fecha = ${sqlEscape(fecha)}`);
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
            conditions.push(`r.tenant_id = ${sqlEscape(req.tenant.id)}`);
        }

        if (search) {
            const s = String(search).replace(/'/g, "''");
            conditions.push(`(r.cliente ILIKE '%${s}%' OR r.id ILIKE '%${s}%' OR CAST(r.canchaId AS TEXT) ILIKE '%${s}%')`);
        }
        if (estado && estado !== 'todos') {
            conditions.push(`r.estado = ${sqlEscape(estado)}`);
        }
        if (desde) {
            conditions.push(`r.fecha >= ${sqlEscape(desde)}`);
        }
        if (hasta) {
            conditions.push(`r.fecha <= ${sqlEscape(hasta)}`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const safeLimit = parseInt(limit) || 100;

        const query = `
            SELECT r.*, 
                   r.comprobante_url,
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
        const { tenant } = req.query;

        let tenantFilter = '';
        if (tenant) {
            const safeTenant = tenant;
            const tRes = await executeQuery(`SELECT id FROM tenants WHERE slug = ${sqlEscape(safeTenant)}`);
            if (tRes && tRes.length > 0) {
                tenantFilter = `AND tenant_id = ${sqlEscape(tRes[0].id)}`;
            }
        }

        let query;
        if (!isNaN(userId) && String(userId).trim() !== '') {
            query = `SELECT * FROM reservas WHERE (cliente = ${sqlEscape(userId)} OR cliente_id = ${sqlEscape(parseInt(userId))}) ${tenantFilter}`;
        } else {
            query = `SELECT * FROM reservas WHERE cliente = ${sqlEscape(userId)} ${tenantFilter}`;
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
        if (isNaN(safeCanchaId)) return res.status(400).json({ error: 'Cancha ID inválido' });

        const safeDuracion = parseInt(duracion) || 60;
        const safePrecio = parseInt(precio) || 0;
        const safeClienteId = cliente_id ? parseInt(cliente_id) : null;
        const finalEstado = estado || 'por confirmar';

        // Get tenant_id from cancha
        const canchaRes = await executeQuery(`SELECT tenant_id FROM canchas WHERE id = ${sqlEscape(safeCanchaId)}`);
        const tenantId = (canchaRes && canchaRes.length > 0) ? canchaRes[0].tenant_id : 0;

        // Validar solapamientos
        const checkQuery = `
            SELECT id, hora, duracion 
            FROM reservas 
            WHERE canchaId = ${sqlEscape(safeCanchaId)} 
              AND fecha = ${sqlEscape(fecha)} 
              AND estado != 'cancelada'
        `;
        const reservasExistentes = await executeQuery(checkQuery) || [];
        
        const newStart = parseHoraToMinutes(hora);
        const newEnd = newStart + safeDuracion;

        for (const r of reservasExistentes) {
            const resStart = parseHoraToMinutes(r.hora);
            const resEnd = resStart + (r.duracion || 60);

            if (newStart < resEnd && newEnd > resStart) {
                return res.status(400).json({ error: 'La cancha ya se encuentra reservada o bloqueada en ese horario.' });
            }
        }

        const query = `
            INSERT INTO reservas (id, canchaId, fecha, hora, cliente, cliente_id, duracion, precio, estado, tenant_id) 
            VALUES (${sqlEscape(id)}, ${sqlEscape(safeCanchaId)}, ${sqlEscape(fecha)}, ${sqlEscape(hora)}, ${sqlEscape(cliente)}, ${sqlEscape(safeClienteId)}, ${sqlEscape(safeDuracion)}, ${sqlEscape(safePrecio)}, ${sqlEscape(finalEstado)}, ${sqlEscape(tenantId)})
        `;
        
        await executeQuery(query);
        
        // Return the created ID as frontend expects it
        res.status(201).json({ 
            message: 'Reserva creada con éxito', 
            data: { id, canchaId: safeCanchaId, fecha, hora, cliente, cliente_id: safeClienteId, duracion: safeDuracion, precio: safePrecio }
        });

        // Trigger Notification
        if (safeClienteId) {
            try {
                const cliRes = await executeQuery(`SELECT email, telefono, nombre FROM clientes WHERE id = ${sqlEscape(safeClienteId)}`);
                if (cliRes && cliRes.length > 0) {
                    await notifyReservationCreated({
                        id, fecha, hora, precio: safePrecio, cliente, estado: finalEstado
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
        
        const tenantFilter = req.tenant && req.tenant.id ? `AND tenant_id = ${sqlEscape(req.tenant.id)}` : '';
        await executeQuery(`UPDATE reservas SET estado = ${sqlEscape(status)} WHERE id = ${sqlEscape(id)} ${tenantFilter}`);
        
        res.json({ message: `Estado de la reserva ${id} actualizado a ${status}` });

        // Trigger Notification
        try {
            const resData = await executeQuery(`
                SELECT r.fecha, r.hora, r.cliente, c.email, c.telefono, c.nombre 
                FROM reservas r 
                LEFT JOIN clientes c ON r.cliente_id = c.id 
                WHERE r.id = ${sqlEscape(id)}
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
        const tenantFilter = req.tenant && req.tenant.id ? `WHERE tenant_id = ${sqlEscape(req.tenant.id)}` : '';
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
            `SELECT * FROM reservas WHERE id = ${sqlEscape(id)} AND cliente_id = ${sqlEscape(clientId)}`
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

        await executeQuery(`UPDATE reservas SET estado = 'cancelada' WHERE id = ${sqlEscape(id)}`);
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
