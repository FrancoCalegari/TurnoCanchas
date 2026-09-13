const { executeQuery, sqlEscape } = require('../config/db');

const getAll = async (req, res) => {
    try {
        let tenantFilter = '';
        if (req.tenant && req.tenant.id) {
            // Admin request
            tenantFilter = `WHERE tenant_id = ${sqlEscape(req.tenant.id)}`;
        } else if (req.query.tenant) {
            // Public request
            const safeSlug = req.query.tenant;
            const tRes = await executeQuery(`SELECT id FROM tenants WHERE slug = ${sqlEscape(safeSlug)}`);
            if (tRes && tRes.length > 0) {
                tenantFilter = `WHERE tenant_id = ${sqlEscape(tRes[0].id)}`;
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
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
        
        let tenantFilter = '';
        if (req.tenant && req.tenant.id) {
            tenantFilter = `AND tenant_id = ${sqlEscape(req.tenant.id)}`;
        }
        const result = await executeQuery(`SELECT * FROM canchas WHERE id = ${sqlEscape(id)} ${tenantFilter}`);
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
        
        const safeNombre = sqlEscape(nombre);
        const safeDeporte = sqlEscape(deporte);
        const safeDesc = sqlEscape(descripcion || '');
        const safeColor = sqlEscape(colorTag || '');
        const safeEstado = sqlEscape(estado || 'disponible');
        const safePrecio = parseInt(precioPorHora) || 0;
        const safeSena = parseInt(porcentaje_sena) || 50;
        const tenantId = req.tenant ? req.tenant.id : 0;

        if (!tenantId) return res.status(403).json({ error: 'Se requiere contexto de tenant' });

        const query = `
            INSERT INTO canchas (nombre, deporte, descripcion, precioPorHora, estado, colorTag, porcentaje_sena, tenant_id) 
            VALUES (${safeNombre}, ${safeDeporte}, ${safeDesc}, ${safePrecio}, ${safeEstado}, ${safeColor}, ${safeSena}, ${sqlEscape(tenantId)})
        `;
        await executeQuery(query);
        res.status(201).json({ message: 'Servicio creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
        
        const { nombre, deporte, descripcion, precioPorHora, estado, colorTag, porcentaje_sena } = req.body;
        
        let updates = [];
        if (nombre !== undefined) updates.push(`nombre = ${sqlEscape(nombre)}`);
        if (deporte !== undefined) updates.push(`deporte = ${sqlEscape(deporte)}`);
        if (descripcion !== undefined) updates.push(`descripcion = ${sqlEscape(descripcion)}`);
        if (precioPorHora !== undefined) updates.push(`precioPorHora = ${parseInt(precioPorHora) || 0}`);
        if (estado !== undefined) updates.push(`estado = ${sqlEscape(estado)}`);
        if (colorTag !== undefined) updates.push(`colorTag = ${sqlEscape(colorTag)}`);
        if (porcentaje_sena !== undefined) updates.push(`porcentaje_sena = ${parseInt(porcentaje_sena) || 50}`);

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        const tenantFilter = req.tenant && req.tenant.id ? `AND tenant_id = ${sqlEscape(req.tenant.id)}` : '';
        const query = `UPDATE canchas SET ${updates.join(', ')} WHERE id = ${sqlEscape(id)} ${tenantFilter}`;
        await executeQuery(query);

        res.json({ message: `Registro ${id} actualizado` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteCancha = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
        
        const tenantFilter = req.tenant && req.tenant.id ? `AND tenant_id = ${sqlEscape(req.tenant.id)}` : '';
        await executeQuery(`DELETE FROM canchas WHERE id = ${sqlEscape(id)} ${tenantFilter}`);
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
