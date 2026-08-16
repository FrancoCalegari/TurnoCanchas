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

const getByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await executeQuery(`SELECT * FROM reservas WHERE cliente = '${String(userId).replace(/'/g, "''")}'`);
        res.json({ message: `Reservas del usuario ${userId}`, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { canchaId, fecha, hora, cliente, duracion, precio } = req.body;
        
        // Generate a random ID like 'RES-XYZ123'
        const id = 'RES-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        
        const safeCanchaId = parseInt(canchaId);
        const safeFecha = String(fecha).replace(/'/g, "''");
        const safeHora = String(hora).replace(/'/g, "''");
        const safeCliente = String(cliente).replace(/'/g, "''");
        const safeDuracion = parseInt(duracion) || 60;
        const safePrecio = parseInt(precio) || 0;

        const query = `
            INSERT INTO reservas (id, canchaId, fecha, hora, cliente, duracion, precio, estado) 
            VALUES ('${id}', ${safeCanchaId}, '${safeFecha}', '${safeHora}', '${safeCliente}', ${safeDuracion}, ${safePrecio}, 'confirmada')
        `;
        
        await executeQuery(query);
        
        // Return the created ID as frontend expects it
        res.status(201).json({ 
            message: 'Reserva creada con éxito', 
            data: { id, canchaId: safeCanchaId, fecha: safeFecha, hora: safeHora, cliente: safeCliente, duracion: safeDuracion, precio: safePrecio }
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
    getByUser,
    create,
    updateStatus,
    getRecent
};
