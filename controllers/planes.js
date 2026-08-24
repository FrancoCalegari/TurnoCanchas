const { executeQuery } = require('../config/db');

// Obtener todos los planes (Público)
const getPlanes = async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM planes WHERE activo = 1 ORDER BY precio ASC');
        res.json({ data: result || [] });
    } catch (error) {
        console.error('Error fetching planes:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener planes' });
    }
};

// Crear un plan (Superadmin)
const createPlan = async (req, res) => {
    try {
        const { nombre, precio, caracteristicas, activo } = req.body;
        
        if (!nombre || precio === undefined) {
            return res.status(400).json({ error: 'Nombre y precio son requeridos' });
        }

        const safeNombre = String(nombre).replace(/'/g, "''");
        const safeCarac = caracteristicas ? String(caracteristicas).replace(/'/g, "''") : '';
        const activoVal = activo !== undefined ? (activo ? 1 : 0) : 1;

        const result = await executeQuery(`
            INSERT INTO planes (nombre, precio, caracteristicas, activo) 
            VALUES ('${safeNombre}', ${precio}, '${safeCarac}', ${activoVal})
        `);

        res.status(201).json({ message: 'Plan creado exitosamente', id: result.insertId });
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({ error: 'Error interno del servidor al crear el plan' });
    }
};

// Actualizar un plan (Superadmin)
const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, precio, caracteristicas, activo } = req.body;
        
        let updates = [];
        if (nombre !== undefined) {
            const safeNombre = String(nombre).replace(/'/g, "''");
            updates.push(`nombre = '${safeNombre}'`);
        }
        if (precio !== undefined) {
            updates.push(`precio = ${precio}`);
        }
        if (caracteristicas !== undefined) {
            const safeCarac = String(caracteristicas).replace(/'/g, "''");
            updates.push(`caracteristicas = '${safeCarac}'`);
        }
        if (activo !== undefined) {
            updates.push(`activo = ${activo ? 1 : 0}`);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No data to update' });
        }

        await executeQuery(`UPDATE planes SET ${updates.join(', ')} WHERE id = ${id}`);
        res.json({ message: 'Plan actualizado exitosamente' });
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ error: 'Error interno del servidor al actualizar el plan' });
    }
};

// Eliminar un plan (Superadmin)
const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        await executeQuery(`DELETE FROM planes WHERE id = ${id}`);
        res.json({ message: 'Plan eliminado exitosamente' });
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({ error: 'Error interno del servidor al eliminar el plan' });
    }
};

module.exports = {
    getPlanes,
    createPlan,
    updatePlan,
    deletePlan
};
