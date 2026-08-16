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
        const { nombre_complejo, open_time, close_time, wpp_contacto, ubicacion_maps, logo_url, hero_image_url, hero_title, canchas_title, nosotros_title } = req.body;
        
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
        if (ubicacion_maps !== undefined) {
            const safe = String(ubicacion_maps).replace(/'/g, "''");
            updates.push(`ubicacion_maps = '${safe}'`);
        }
        if (logo_url !== undefined) {
            const safe = String(logo_url).replace(/'/g, "''");
            updates.push(`logo_url = '${safe}'`);
        }
        if (hero_image_url !== undefined) {
            const safe = String(hero_image_url).replace(/'/g, "''");
            updates.push(`hero_image_url = '${safe}'`);
        }
        if (hero_title !== undefined) {
            const safe = String(hero_title).replace(/'/g, "''");
            updates.push(`hero_title = '${safe}'`);
        }
        if (canchas_title !== undefined) {
            const safe = String(canchas_title).replace(/'/g, "''");
            updates.push(`canchas_title = '${safe}'`);
        }
        if (nosotros_title !== undefined) {
            const safe = String(nosotros_title).replace(/'/g, "''");
            updates.push(`nosotros_title = '${safe}'`);
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
