const { executeQuery, sqlEscape } = require('../config/db');

const getAjustes = async (req, res) => {
    try {
        let tenantFilter = 'tenant_id = 0'; // Fallback to 0 if no tenant specified
        if (req.tenant && req.tenant.id) {
            tenantFilter = `tenant_id = ${sqlEscape(req.tenant.id)}`;
        } else if (req.query.tenant) {
            const safeSlug = req.query.tenant;
            const tRes = await executeQuery(`SELECT id FROM tenants WHERE slug = ${sqlEscape(safeSlug)}`);
            if (tRes && tRes.length > 0) {
                tenantFilter = `tenant_id = ${sqlEscape(tRes[0].id)}`;
            } else {
                return res.status(404).json({ error: 'Tenant no encontrado' });
            }
        }

        // Asegurar que las columnas existan
        const checkCols = await executeQuery("SHOW COLUMNS FROM ajustes_complejo");
        const existingColumns = checkCols.map(c => c.Field);
        
        const newColumns = [];
        if (!existingColumns.includes('info_wifi_ssid')) newColumns.push("ALTER TABLE ajustes_complejo ADD COLUMN info_wifi_ssid VARCHAR(100)");
        if (!existingColumns.includes('info_wifi_pass')) newColumns.push("ALTER TABLE ajustes_complejo ADD COLUMN info_wifi_pass VARCHAR(100)");
        if (!existingColumns.includes('info_buffet')) newColumns.push("ALTER TABLE ajustes_complejo ADD COLUMN info_buffet VARCHAR(255)");
        if (!existingColumns.includes('info_reglas')) newColumns.push("ALTER TABLE ajustes_complejo ADD COLUMN info_reglas TEXT");
        if (!existingColumns.includes('horario_modo')) newColumns.push("ALTER TABLE ajustes_complejo ADD COLUMN horario_modo VARCHAR(50) DEFAULT 'todos_los_dias'");
        if (!existingColumns.includes('horarios_semana')) newColumns.push("ALTER TABLE ajustes_complejo ADD COLUMN horarios_semana TEXT");
        if (!existingColumns.includes('intervalo_turnos')) newColumns.push("ALTER TABLE ajustes_complejo ADD COLUMN intervalo_turnos INT DEFAULT 60");
        for (const sql of newColumns) {
            try { await executeQuery(sql); } catch (e) {}
        }
        const result = await executeQuery(`SELECT * FROM ajustes_complejo WHERE ${tenantFilter}`);
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
        const { nombre_complejo, open_time, close_time, wpp_contacto, wpp_mensaje, ubicacion_maps, logo_url, hero_image_url, hero_image_url_2, hero_image_url_3, hero_title, canchas_title, nosotros_title, devolver_sena, mercadopago_alias, info_wifi_ssid, info_wifi_pass, info_buffet, info_reglas, horario_modo, horarios_semana, intervalo_turnos } = req.body;
        
        let updates = [];
        if (nombre_complejo !== undefined) updates.push(`nombre_complejo = ${sqlEscape(nombre_complejo)}`);
        if (open_time !== undefined) updates.push(`open_time = ${sqlEscape(open_time)}`);
        if (close_time !== undefined) updates.push(`close_time = ${sqlEscape(close_time)}`);
        if (wpp_contacto !== undefined) updates.push(`wpp_contacto = ${sqlEscape(wpp_contacto)}`);
        if (wpp_mensaje !== undefined) updates.push(`wpp_mensaje = ${sqlEscape(wpp_mensaje)}`);
        if (devolver_sena !== undefined) updates.push(`devolver_sena = ${sqlEscape(devolver_sena)}`);
        if (ubicacion_maps !== undefined) updates.push(`ubicacion_maps = ${sqlEscape(ubicacion_maps)}`);
        if (logo_url !== undefined) updates.push(`logo_url = ${sqlEscape(logo_url)}`);
        if (hero_image_url !== undefined) updates.push(`hero_image_url = ${sqlEscape(hero_image_url)}`);
        if (hero_image_url_2 !== undefined) updates.push(`hero_image_url_2 = ${sqlEscape(hero_image_url_2)}`);
        if (hero_image_url_3 !== undefined) updates.push(`hero_image_url_3 = ${sqlEscape(hero_image_url_3)}`);
        if (hero_title !== undefined) updates.push(`hero_title = ${sqlEscape(hero_title)}`);
        if (canchas_title !== undefined) updates.push(`canchas_title = ${sqlEscape(canchas_title)}`);
        if (nosotros_title !== undefined) updates.push(`nosotros_title = ${sqlEscape(nosotros_title)}`);
        if (mercadopago_alias !== undefined) updates.push(`mercadopago_alias = ${sqlEscape(mercadopago_alias)}`);
        if (info_wifi_ssid !== undefined) updates.push(`info_wifi_ssid = ${sqlEscape(info_wifi_ssid)}`);
        if (info_wifi_pass !== undefined) updates.push(`info_wifi_pass = ${sqlEscape(info_wifi_pass)}`);
        if (info_buffet !== undefined) updates.push(`info_buffet = ${sqlEscape(info_buffet)}`);
        if (info_reglas !== undefined) updates.push(`info_reglas = ${sqlEscape(info_reglas)}`);
        
        if (horario_modo !== undefined) updates.push(`horario_modo = ${sqlEscape(horario_modo)}`);
        if (horarios_semana !== undefined) updates.push(`horarios_semana = ${sqlEscape(typeof horarios_semana === 'string' ? horarios_semana : JSON.stringify(horarios_semana))}`);
        if (intervalo_turnos !== undefined) updates.push(`intervalo_turnos = ${sqlEscape(intervalo_turnos)}`);
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No data to update' });
        }

        const tenantId = req.tenant ? req.tenant.id : 0;
        const query = `UPDATE ajustes_complejo SET ${updates.join(', ')} WHERE tenant_id = ${sqlEscape(tenantId)}`;
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
