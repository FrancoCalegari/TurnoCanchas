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

// ─── Información pública / branding de la plataforma ──────────────────────────
const getInfo = async (req, res) => {
    try {
        // Asegurar que las columnas existan (idempotente sin generar logs de error)
        const checkCols = await executeQuery("SHOW COLUMNS FROM plataforma_config LIKE 'logo_url'");
        if (!checkCols || checkCols.length === 0) {
            const columns = [
                "ALTER TABLE plataforma_config ADD COLUMN logo_url VARCHAR(500)",
                "ALTER TABLE plataforma_config ADD COLUMN favicon_url VARCHAR(500)",
                "ALTER TABLE plataforma_config ADD COLUMN nombre_plataforma VARCHAR(150)",
                "ALTER TABLE plataforma_config ADD COLUMN tagline VARCHAR(250)",
                "ALTER TABLE plataforma_config ADD COLUMN links_servicios TEXT"
            ];
            for (const sql of columns) {
                try { await executeQuery(sql); } catch (e) {}
            }
        }

        const result = await executeQuery('SELECT logo_url, favicon_url, nombre_plataforma, tagline, links_servicios FROM plataforma_config WHERE id = 1');
        if (!result || result.length === 0) {
            return res.json({ data: {} });
        }
        const row = result[0];
        let links = [];
        try { links = JSON.parse(row.links_servicios || '[]'); } catch (e) {}
        res.json({ data: { ...row, links_servicios: links } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateInfo = async (req, res) => {
    try {
        const { logo_url, favicon_url, nombre_plataforma, tagline, links_servicios } = req.body;

        let updates = [];
        if (logo_url !== undefined) updates.push(`logo_url = '${String(logo_url).replace(/'/g, "''")}'`);
        if (favicon_url !== undefined) updates.push(`favicon_url = '${String(favicon_url).replace(/'/g, "''")}'`);
        if (nombre_plataforma !== undefined) updates.push(`nombre_plataforma = '${String(nombre_plataforma).replace(/'/g, "''")}'`);
        if (tagline !== undefined) updates.push(`tagline = '${String(tagline).replace(/'/g, "''")}'`);
        if (links_servicios !== undefined) {
            const linksJson = JSON.stringify(links_servicios).replace(/'/g, "''");
            updates.push(`links_servicios = '${linksJson}'`);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        await executeQuery(`UPDATE plataforma_config SET ${updates.join(', ')} WHERE id = 1`);
        res.json({ message: 'Información de plataforma actualizada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const fs = require('fs');
const path = require('path');

const uploadLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        const logoUrl = '/uploads/' + req.file.filename;
        const faviconUrl = '/favicon.ico';
        
        // Copy the uploaded file to public/favicon.ico
        const uploadedPath = req.file.path;
        const faviconPath = path.join(__dirname, '../public/favicon.ico');
        fs.copyFileSync(uploadedPath, faviconPath);

        // Update database
        await executeQuery(`UPDATE plataforma_config SET logo_url = '${logoUrl}', favicon_url = '${faviconUrl}' WHERE id = 1`);

        res.json({ message: 'Logo subido con éxito', logo_url: logoUrl, favicon_url: faviconUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getStatus,
    updateStatus,
    getInfo,
    updateInfo,
    uploadLogo
};
