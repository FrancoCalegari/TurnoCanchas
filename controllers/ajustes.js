const { executeQuery } = require('../config/db');

const getAjustes = async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM ajustes_complejo WHERE id = 1');
        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }
        res.json({ message: 'Ajustes del complejo', data: result[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateAjustes = async (req, res) => {
    try {
        const { nombre_complejo, open_time, close_time, wpp_contacto } = req.body;
        
        let updates = [];
        if (nombre_complejo !== undefined) {
            const safe = String(nombre_complejo).replace(/'/g, "''");
            updates.push(`nombre_complejo = '${safe}'`);
        }
        if (open_time !== undefined) {
            const safe = String(open_time).replace(/'/g, "''");
            updates.push(`open_time = '${safe}'`);
        }
        if (close_time !== undefined) {
            const safe = String(close_time).replace(/'/g, "''");
            updates.push(`close_time = '${safe}'`);
        }
        if (wpp_contacto !== undefined) {
            const safe = String(wpp_contacto).replace(/'/g, "''");
            updates.push(`wpp_contacto = '${safe}'`);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No data to update' });
        }

        const query = `UPDATE ajustes_complejo SET ${updates.join(', ')} WHERE id = 1`;
        await executeQuery(query);

        res.json({ message: 'Ajustes actualizados exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAjustes,
    updateAjustes
};
