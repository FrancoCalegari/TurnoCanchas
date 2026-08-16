const { executeQuery } = require('../config/db');

const getStatus = async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM plataforma_config WHERE id = 1');
        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }
        res.json({ message: 'Estado de la plataforma', data: result[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { estado, fecha_vencimiento, demo_mode } = req.body;
        
        let updates = [];
        if (estado !== undefined) {
            const safeEstado = String(estado).replace(/'/g, "''");
            updates.push(`estado = '${safeEstado}'`);
        }
        if (fecha_vencimiento !== undefined) {
            const safeFecha = String(fecha_vencimiento).replace(/'/g, "''");
            updates.push(`fecha_vencimiento = '${safeFecha}'`);
        }
        if (demo_mode !== undefined) {
            const safeDemo = String(demo_mode).replace(/'/g, "''");
            updates.push(`demo_mode = '${safeDemo}'`);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No data to update' });
        }

        const query = `UPDATE plataforma_config SET ${updates.join(', ')} WHERE id = 1`;
        await executeQuery(query);

        res.json({ message: 'Configuración actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getStatus,
    updateStatus
};
