const { executeQuery } = require('../config/db');

const getAll = async (req, res) => {
    try {
        const canchas = await executeQuery('SELECT * FROM canchas');
        res.json({ message: 'Listado de canchas', data: canchas });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery(`SELECT * FROM canchas WHERE id = ${id}`);
        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'Cancha no encontrada' });
        }
        res.json({ message: `Detalles de la cancha ${id}`, data: result[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { nombre, deporte, descripcion, precioPorHora, estado, colorTag, porcentaje_sena } = req.body;
        // Basic SQL injection prevention is usually handled by parametrized queries,
        // but since SpiderWeb API takes a raw string, we'll try to sanitize quotes simply.
        const safeNombre = String(nombre).replace(/'/g, "''");
        const safeDeporte = String(deporte).replace(/'/g, "''");
        const safeDesc = String(descripcion || '').replace(/'/g, "''");
        const safeColor = String(colorTag || '').replace(/'/g, "''");
        const safeEstado = String(estado || 'disponible').replace(/'/g, "''");
        const safePrecio = parseInt(precioPorHora) || 0;
        const safeSena = parseInt(porcentaje_sena) || 50;

        const query = `
            INSERT INTO canchas (nombre, deporte, descripcion, precioPorHora, estado, colorTag, porcentaje_sena) 
            VALUES ('${safeNombre}', '${safeDeporte}', '${safeDesc}', ${safePrecio}, '${safeEstado}', '${safeColor}', ${safeSena})
        `;
        await executeQuery(query);
        res.status(201).json({ message: 'Cancha creada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, deporte, descripcion, precioPorHora, estado, colorTag, porcentaje_sena } = req.body;
        
        let updates = [];
        if (nombre !== undefined) updates.push(`nombre = '${String(nombre).replace(/'/g, "''")}'`);
        if (deporte !== undefined) updates.push(`deporte = '${String(deporte).replace(/'/g, "''")}'`);
        if (descripcion !== undefined) updates.push(`descripcion = '${String(descripcion).replace(/'/g, "''")}'`);
        if (precioPorHora !== undefined) updates.push(`precioPorHora = ${parseInt(precioPorHora) || 0}`);
        if (estado !== undefined) updates.push(`estado = '${String(estado).replace(/'/g, "''")}'`);
        if (colorTag !== undefined) updates.push(`colorTag = '${String(colorTag).replace(/'/g, "''")}'`);
        if (porcentaje_sena !== undefined) updates.push(`porcentaje_sena = ${parseInt(porcentaje_sena) || 50}`);

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const query = `UPDATE canchas SET ${updates.join(', ')} WHERE id = ${id}`;
        await executeQuery(query);

        res.json({ message: `Cancha ${id} actualizada` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteCancha = async (req, res) => {
    try {
        const { id } = req.params;
        await executeQuery(`DELETE FROM canchas WHERE id = ${id}`);
        res.json({ message: `Cancha ${id} eliminada` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    deleteCancha
};
