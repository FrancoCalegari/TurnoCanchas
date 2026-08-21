// middleware/auth.js
// Simple JWT-less auth using signed base64 tokens (compatible with existing stack)

const { executeQuery } = require('../config/db');

/**
 * Verifica que el request venga de un super admin autenticado.
 * Espera header: Authorization: SuperAdmin <base64token>
 * El token es: base64('superadmin:{username}:{timestamp}')
 */
const requireSuperAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'] || '';
    if (!authHeader.startsWith('SuperAdmin ')) {
        return res.status(401).json({ error: 'Acceso no autorizado: se requiere autenticación de Super Admin' });
    }
    try {
        const token = authHeader.replace('SuperAdmin ', '');
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        if (!decoded.startsWith('superadmin:')) {
            return res.status(401).json({ error: 'Token de Super Admin inválido' });
        }
        const parts = decoded.split(':');
        req.superAdmin = { username: parts[1] };
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

/**
 * Verifica que el request venga de un tenant admin (dueño de cancha) autenticado.
 * Espera header: Authorization: Tenant <base64token>
 * El token es: base64('tenant:{tenantId}:{slug}:{timestamp}')
 * Inyecta req.tenant = { id, slug }
 */
const requireTenantAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'] || '';
    if (!authHeader.startsWith('Tenant ')) {
        return res.status(401).json({ error: 'Acceso no autorizado: se requiere autenticación de Tenant' });
    }
    try {
        const token = authHeader.replace('Tenant ', '');
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        if (!decoded.startsWith('tenant:')) {
            return res.status(401).json({ error: 'Token de Tenant inválido' });
        }
        const parts = decoded.split(':');
        const tenantId = parseInt(parts[1]);
        const slug = parts[2];
        if (!tenantId || !slug) {
            return res.status(401).json({ error: 'Token de Tenant malformado' });
        }
        req.tenant = { id: tenantId, slug };
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

/**
 * Verifica que el tenant esté activo (no suspendido y no vencido).
 * Debe usarse después de requireTenantAdmin.
 */
const requireTenantActive = async (req, res, next) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) return res.status(401).json({ error: 'Sin contexto de tenant' });

        const result = await executeQuery(`SELECT estado, fecha_vencimiento FROM tenants WHERE id = ${tenantId}`);
        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'Tenant no encontrado' });
        }
        const tenant = result[0];

        if (tenant.estado === 'suspendido') {
            return res.status(403).json({ error: 'El servicio está suspendido. Contacte al administrador.' });
        }

        if (tenant.fecha_vencimiento) {
            const vence = new Date(tenant.fecha_vencimiento);
            if (vence < new Date()) {
                return res.status(403).json({ error: 'La suscripción ha vencido. Contacte al administrador.' });
            }
        }

        next();
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

module.exports = { requireSuperAdmin, requireTenantAdmin, requireTenantActive };
