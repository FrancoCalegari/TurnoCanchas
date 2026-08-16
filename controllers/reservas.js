const { executeQuery } = require('../config/db');

const getAll = async (req, res) => {
    try {
        const { fecha } = req.query;
        let query = 'SELECT * FROM reservas';
        if (fecha) {
            query += ` WHERE fecha = '${String(fecha).replace(/'/g, "''")}'`;
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

        const query = `
            INSERT INTO reservas (id, canchaId, fecha, hora, cliente, cliente_id, duracion, precio, estado) 
            VALUES ('${id}', ${safeCanchaId}, '${safeFecha}', '${safeHora}', '${safeCliente}', ${safeClienteId}, ${safeDuracion}, ${safePrecio}, '${finalEstado}')
        `;
        
        await executeQuery(query);
        
        // Return the created ID as frontend expects it
        res.status(201).json({ 
            message: 'Reserva creada con éxito', 
            data: { id, canchaId: safeCanchaId, fecha: safeFecha, hora: safeHora, cliente: safeCliente, cliente_id: safeClienteId !== 'NULL' ? safeClienteId : null, duracion: safeDuracion, precio: safePrecio }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const safeStatus = String(status).replace(/'/g, "''");
        await executeQuery(`UPDATE reservas SET estado = '${safeStatus}' WHERE id = '${id}'`);
        
        res.json({ message: `Estado de la reserva ${id} actualizado a ${status}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRecent = async (req, res) => {
    try {
        // Obtenemos las últimas 50 reservas order by createdat desc
        // The mock returned this endpoint for the admin
        const result = await executeQuery(`SELECT * FROM reservas ORDER BY createdAt DESC LIMIT 50`);
        res.json({ message: 'Reservas recientes', data: result });
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
    getRecent
};
