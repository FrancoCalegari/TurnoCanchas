// controllers/rubros.js
const { executeQuery } = require('../config/db');

const listRubros = async (req, res) => {
    try {
        const rubros = await executeQuery('SELECT * FROM rubros ORDER BY id ASC');
        res.json({ data: rubros || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRubro = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery(`SELECT * FROM rubros WHERE id = ${parseInt(id)}`);
        if (!result || result.length === 0) return res.status(404).json({ error: 'Rubro no encontrado' });
        res.json({ data: result[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createRubro = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

        const safeNombre = String(nombre).replace(/'/g, "''");
        const safeDesc = String(descripcion || '').replace(/'/g, "''");

        await executeQuery(`
            INSERT INTO rubros (nombre, descripcion)
            VALUES ('${safeNombre}', '${safeDesc}')
        `);

        res.status(201).json({ message: 'Rubro creado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateRubro = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, activo } = req.body;

        if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

        const safeNombre = String(nombre).replace(/'/g, "''");
        const safeDesc = String(descripcion || '').replace(/'/g, "''");
        const act = activo ? 1 : 0;

        await executeQuery(`
            UPDATE rubros 
            SET nombre = '${safeNombre}', descripcion = '${safeDesc}', activo = ${act}
            WHERE id = ${parseInt(id)}
        `);

        res.json({ message: 'Rubro actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteRubro = async (req, res) => {
    try {
        const { id } = req.params;
        // Verify if tenants exist with this rubro
        const tenants = await executeQuery(`SELECT COUNT(*) as count FROM tenants WHERE rubro_id = ${parseInt(id)}`);
        const count = Array.isArray(tenants) && tenants[0] ? parseInt(tenants[0].count) : 0;
        
        if (count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar el rubro porque hay clientes (tenants) usándolo.' });
        }

        await executeQuery(`DELETE FROM rubros WHERE id = ${parseInt(id)}`);
        res.json({ message: 'Rubro eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    listRubros,
    getRubro,
    createRubro,
    updateRubro,
    deleteRubro
};
