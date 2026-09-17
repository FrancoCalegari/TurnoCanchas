const { executeQuery, sqlEscape } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../utils/mailer');

const register = async (req, res) => { res.status(201).json({ message: 'Stub' }); };
const login = async (req, res) => { res.json({ message: 'Stub' }); };
const getProfile = async (req, res) => { res.json({ message: 'Stub' }); };
const updateProfile = async (req, res) => { res.json({ message: 'Stub' }); };

const getAdminClientes = async (req, res) => {
    try {
        const tenantId = req.tenant.id; // from requireAuth middleware
        const { search } = req.query;

        // Mostrar clientes del tenant actual, o clientes globales (0), o clientes que tengan reservas en este tenant
        let conditions = [`(c.tenant_id = ${sqlEscape(tenantId)} OR c.tenant_id = 0 OR c.id IN (SELECT cliente_id FROM reservas WHERE tenant_id = ${sqlEscape(tenantId)}))`];

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

const deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenant.id;

        const checkQuery = `SELECT * FROM clientes WHERE id = ${sqlEscape(id)}`;
        const existing = await executeQuery(checkQuery);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        // 1. Orfanamos las reservas (opcional, pero seguro para mantener stats)
        const orphanReservas = `UPDATE reservas SET cliente_id = NULL WHERE cliente_id = ${sqlEscape(id)}`;
        await executeQuery(orphanReservas);

        // 2. Borramos el cliente
        const delQuery = `DELETE FROM clientes WHERE id = ${sqlEscape(id)}`;
        await executeQuery(delQuery);

        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const adminResetPassword = async (req, res) => {
    try {
        const { id } = req.params;

        const checkQuery = `SELECT * FROM clientes WHERE id = ${sqlEscape(id)}`;
        const existing = await executeQuery(checkQuery);
        if (!existing || existing.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const user = existing[0];
        
        // Generar contraseña temporal de 8 caracteres
        const tempPassword = crypto.randomBytes(4).toString('hex');
        
        // Hashear
        const SALT_ROUNDS = 10;
        const hashedPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS);
        const safeHash = hashedPassword.replace(/'/g, "''");

        // Actualizar DB
        const updateQuery = `UPDATE clientes SET password = '${safeHash}' WHERE id = ${user.id}`;
        await executeQuery(updateQuery);

        // Enviar correo
        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #333;">Nueva contraseña generada</h2>
                <p>Hola ${user.nombre},</p>
                <p>El administrador del complejo ha restablecido tu contraseña.</p>
                <p>Tu nueva contraseña temporal es: <strong style="font-size: 18px; color: #2563eb;">${tempPassword}</strong></p>
                <p style="color: #666; font-size: 14px;">Te recomendamos iniciar sesión y cambiar esta contraseña desde tu perfil lo antes posible.</p>
            </div>
        `;

        await sendEmail({
            to: user.email,
            subject: 'Tu nueva contraseña temporal - TurnoCanchas',
            html: emailHtml
        });

        res.json({ message: 'Contraseña generada y enviada correctamente por correo' });
    } catch (error) {
        console.error('Error en adminResetPassword:', error);
        res.status(500).json({ error: 'Error interno al restablecer contraseña' });
    }
};

module.exports = {
    register, login, getProfile, updateProfile, getAdminClientes, deleteCliente, adminResetPassword
};
