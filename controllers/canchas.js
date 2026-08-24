const { executeQuery } = require('../config/db');

const getAll = async (req, res) => {
    try {
        let tenantFilter = '';
        if (req.tenant && req.tenant.id) {
            // Admin request
            tenantFilter = `WHERE tenant_id = ${req.tenant.id}`;
        } else if (req.query.tenant) {
            // Public request
            const safeSlug = String(req.query.tenant).replace(/'/g, "''");
            const tRes = await executeQuery(`SELECT id FROM tenants WHERE slug = '${safeSlug}'`);
            if (tRes && tRes.length > 0) {
                tenantFilter = `WHERE tenant_id = ${tRes[0].id}`;
            } else {
                return res.status(404).json({ error: 'Tenant no encontrado' });
            }
        }
        
        const canchas = await executeQuery(`SELECT * FROM canchas ${tenantFilter}`);
        res.json({ message: 'Listado de canchas', data: canchas });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        let tenantFilter = '';
        if (req.tenant && req.tenant.id) {
            tenantFilter = `AND tenant_id = ${req.tenant.id}`;
        }
        const result = await executeQuery(`SELECT * FROM canchas WHERE id = ${id} ${tenantFilter}`);
        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'Servicio/Cancha no encontrado' });
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
        const tenantId = req.tenant ? req.tenant.id : 0;

        if (!tenantId) return res.status(403).json({ error: 'Se requiere contexto de tenant' });

        const query = `
            INSERT INTO canchas (nombre, deporte, descripcion, precioPorHora, estado, colorTag, porcentaje_sena, tenant_id) 
            VALUES ('${safeNombre}', '${safeDeporte}', '${safeDesc}', ${safePrecio}, '${safeEstado}', '${safeColor}', ${safeSena}, ${tenantId})
        `;
        await executeQuery(query);
        res.status(201).json({ message: 'Servicio creado exitosamente' });
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
        
        const tenantFilter = req.tenant && req.tenant.id ? `AND tenant_id = ${req.tenant.id}` : '';
        const query = `UPDATE canchas SET ${updates.join(', ')} WHERE id = ${id} ${tenantFilter}`;
        await executeQuery(query);

        res.json({ message: `Registro ${id} actualizado` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteCancha = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantFilter = req.tenant && req.tenant.id ? `AND tenant_id = ${req.tenant.id}` : '';
        await executeQuery(`DELETE FROM canchas WHERE id = ${id} ${tenantFilter}`);
        res.json({ message: `Registro ${id} eliminado` });
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
