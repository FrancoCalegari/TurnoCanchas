const { executeQuery } = require('../config/db');

const register = async (req, res) => { res.status(201).json({ message: 'Stub' }); };
const login = async (req, res) => { res.json({ message: 'Stub' }); };
const getProfile = async (req, res) => { res.json({ message: 'Stub' }); };
const updateProfile = async (req, res) => { res.json({ message: 'Stub' }); };

const getAdminClientes = async (req, res) => {
    try {
        const tenantId = req.tenant.id; // from requireAuth middleware
        const { search } = req.query;

        // Mostrar clientes del tenant actual, o clientes globales (0), o clientes que tengan reservas en este tenant
        let conditions = [`(c.tenant_id = ${tenantId} OR c.tenant_id = 0 OR c.id IN (SELECT cliente_id FROM reservas WHERE tenant_id = ${tenantId}))`];

        if (search) {
            const s = String(search).replace(/'/g, "''");
            conditions.push(`(c.nombre ILIKE '%${s}%' OR c.email ILIKE '%${s}%' OR c.telefono ILIKE '%${s}%')`);
        }

        const where = `WHERE ${conditions.join(' AND ')}`;

        const query = `
            SELECT 
                c.id, c.nombre, c.email, c.telefono, c.createdAt,
                (SELECT COUNT(*) FROM reservas r WHERE r.cliente_id = c.id) as reservas_totales,
                (SELECT COUNT(*) FROM reservas r WHERE r.cliente_id = c.id AND r.estado = 'cancelada') as cancelaciones,
                (SELECT MAX(fecha) FROM reservas r WHERE r.cliente_id = c.id) as ultima_reserva
            FROM clientes c
            ${where}
            ORDER BY c.nombre ASC
        `;

        const result = await executeQuery(query);
        res.json({ message: 'Listado de clientes', data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    register, login, getProfile, updateProfile, getAdminClientes
};
