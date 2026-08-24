// controllers/tenants.js
const { executeQuery } = require('../config/db');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

// ─── Utilidad: calcular días restantes ────────────────────────────────────────
const calcDiasRestantes = (fechaVencimiento) => {
    if (!fechaVencimiento) return null;
    const diff = new Date(fechaVencimiento) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ─── Registro público de tenant (dueño de cancha) ─────────────────────────────
const registerTenant = async (req, res) => {
    try {
        const { nombre, slug, email, password, telefono, ubicacion, rubro_id } = req.body;

        if (!nombre || !slug || !email || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, slug, email, password)' });
        }

        const safeSlug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/'/g, "''");
        const safeEmail = String(email).replace(/'/g, "''").toLowerCase();
        const safeNombre = String(nombre).replace(/'/g, "''");
        const safeTel = String(telefono || '').replace(/'/g, "''");
        const safeUbicacion = String(ubicacion || '').replace(/'/g, "''");

        // Verificar duplicados
        const existingSlug = await executeQuery(`SELECT id FROM tenants WHERE slug = '${safeSlug}'`);
        if (existingSlug && existingSlug.length > 0) {
            return res.status(400).json({ error: 'El slug ya está en uso. Elegí otro nombre de URL.' });
        }
        const existingEmail = await executeQuery(`SELECT id FROM tenants WHERE email = '${safeEmail}'`);
        if (existingEmail && existingEmail.length > 0) {
            return res.status(400).json({ error: 'Ya existe una cuenta con ese email.' });
        }

        const hash = await bcrypt.hash(String(password), SALT_ROUNDS);
        const safeHash = hash.replace(/'/g, "''");
        const safeRubroId = rubro_id ? parseInt(rubro_id) : 1;

        await executeQuery(`
            INSERT INTO tenants (nombre, slug, email, password_hash, telefono, ubicacion, estado, rubro_id)
            VALUES ('${safeNombre}', '${safeSlug}', '${safeEmail}', '${safeHash}', '${safeTel}', '${safeUbicacion}', 'pendiente', ${safeRubroId})
        `);

        res.status(201).json({ message: 'Solicitud enviada exitosamente. Tu cuenta será revisada por el administrador.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Creación Manual de Tenant desde Super Admin ──────────────────────────────
const superCreateTenant = async (req, res) => {
    try {
        const { nombre, slug, email, password, telefono, ubicacion, rubro_id } = req.body;

        if (!nombre || !slug || !email || !password || !rubro_id) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const safeSlug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/'/g, "''");
        const safeEmail = String(email).replace(/'/g, "''").toLowerCase();
        const safeNombre = String(nombre).replace(/'/g, "''");
        const safeTel = String(telefono || '').replace(/'/g, "''");
        const safeUbicacion = String(ubicacion || '').replace(/'/g, "''");
        const safeRubroId = parseInt(rubro_id);

        const existingSlug = await executeQuery(`SELECT id FROM tenants WHERE slug = '${safeSlug}'`);
        if (existingSlug && existingSlug.length > 0) return res.status(400).json({ error: 'El slug ya está en uso' });
        const existingEmail = await executeQuery(`SELECT id FROM tenants WHERE email = '${safeEmail}'`);
        if (existingEmail && existingEmail.length > 0) return res.status(400).json({ error: 'El email ya está en uso' });

        const hash = await bcrypt.hash(String(password), SALT_ROUNDS);
        const safeHash = hash.replace(/'/g, "''");

        // Crear Tenant activo y un mes de prueba
        const vence = new Date();
        vence.setMonth(vence.getMonth() + 1);
        const fechaVenc = vence.toISOString();

        await executeQuery(`
            INSERT INTO tenants (nombre, slug, email, password_hash, telefono, ubicacion, estado, rubro_id, fecha_vencimiento)
            VALUES ('${safeNombre}', '${safeSlug}', '${safeEmail}', '${safeHash}', '${safeTel}', '${safeUbicacion}', 'activo', ${safeRubroId}, '${fechaVenc}')
        `);

        // Get created tenant ID (simplified by slug as we just created it)
        const newT = await executeQuery(`SELECT id FROM tenants WHERE slug = '${safeSlug}'`);
        const tenantId = newT[0].id;

        // Crear ajustes iniciales
        const ajusteId = 100 + parseInt(tenantId);
        await executeQuery(`
            INSERT INTO ajustes_complejo (id, tenant_id, nombre_complejo, open_time, close_time, wpp_contacto, ubicacion_maps)
            VALUES (${ajusteId}, ${tenantId}, '${safeNombre}', '08:00', '23:00', '${safeTel}', '${safeUbicacion}')
        `);

        // Crear usuario admin inicial
        await executeQuery(`
            INSERT INTO admin_users (username, password_hash, tenant_id)
            VALUES ('${safeSlug}', '${safeHash}', ${tenantId})
        `);

        res.status(201).json({ message: 'Cliente creado y activado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Login de tenant ───────────────────────────────────────────────────────────
const loginTenant = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Faltan credenciales' });

        const safeEmail = String(email).replace(/'/g, "''").toLowerCase();
        const result = await executeQuery(`SELECT * FROM tenants WHERE email = '${safeEmail}'`);

        if (!result || result.length === 0) {
            return res.status(401).json({ error: 'Email no registrado' });
        }

        const tenant = result[0];

        const match = await bcrypt.compare(String(password), tenant.password_hash);
        if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

        if (tenant.estado === 'pendiente') {
            return res.status(403).json({ error: 'Tu cuenta está pendiente de aprobación. Te avisaremos cuando esté lista.' });
        }
        if (tenant.estado === 'suspendido') {
            return res.status(403).json({ error: 'Tu servicio está suspendido. Contactá al administrador.' });
        }

        const diasRestantes = calcDiasRestantes(tenant.fecha_vencimiento);
        if (diasRestantes !== null && diasRestantes < 0) {
            return res.status(403).json({ error: 'Tu suscripción venció. Contactá al administrador para renovar.' });
        }

        const token = Buffer.from(`tenant:${tenant.id}:${tenant.slug}:${Date.now()}`).toString('base64');

        res.json({
            token,
            tenant: {
                id: tenant.id,
                nombre: tenant.nombre,
                slug: tenant.slug,
                email: tenant.email,
                estado: tenant.estado,
                fecha_vencimiento: tenant.fecha_vencimiento,
                dias_restantes: diasRestantes,
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Login de Super Admin ──────────────────────────────────────────────────────
const loginSuperAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Faltan credenciales' });

        const safeUser = String(username).replace(/'/g, "''");
        const result = await executeQuery(`SELECT * FROM super_admins WHERE username = '${safeUser}'`);

        if (!result || result.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const admin = result[0];
        const match = await bcrypt.compare(String(password), admin.password_hash);
        if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

        const token = Buffer.from(`superadmin:${admin.username}:${Date.now()}`).toString('base64');
        res.json({ token, username: admin.username });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Listar todos los tenants con stats ───────────────────────────────────────
const listTenants = async (req, res) => {
    try {
        const { estado } = req.query;

        let whereClause = '';
        if (estado && estado !== 'todos') {
            const safeEstado = String(estado).replace(/'/g, "''");
            if (estado === 'por_vencer') {
                // Vence en los próximos 7 días
                whereClause = `WHERE t.estado = 'activo' AND t.fecha_vencimiento IS NOT NULL`;
            } else if (estado === 'vencidos') {
                whereClause = `WHERE t.estado != 'pendiente'`;
            } else {
                whereClause = `WHERE t.estado = '${safeEstado}'`;
            }
        }

        const tenants = await executeQuery(`
            SELECT t.*, r.nombre as rubro_nombre 
            FROM tenants t 
            LEFT JOIN rubros r ON t.rubro_id = r.id 
            ${whereClause} 
            ORDER BY t.createdAt DESC
        `);
        if (!tenants || tenants.length === 0) {
            return res.json({ data: [] });
        }

        // Agregar stats y días restantes a cada tenant
        const tenantsWithStats = await Promise.all(tenants.map(async (t) => {
            try {
                const [canchasRes, reservasRes, clientesRes] = await Promise.all([
                    executeQuery(`SELECT COUNT(*) as count FROM canchas WHERE tenant_id = ${t.id}`),
                    executeQuery(`SELECT COUNT(*) as count FROM reservas WHERE tenant_id = ${t.id} AND estado != 'cancelada'`),
                    executeQuery(`SELECT COUNT(*) as count FROM clientes WHERE tenant_id = ${t.id}`)
                ]);
                const canchas = Array.isArray(canchasRes) && canchasRes[0] ? parseInt(canchasRes[0].count) : 0;
                const reservas = Array.isArray(reservasRes) && reservasRes[0] ? parseInt(reservasRes[0].count) : 0;
                const clientes = Array.isArray(clientesRes) && clientesRes[0] ? parseInt(clientesRes[0].count) : 0;
                const diasRestantes = calcDiasRestantes(t.fecha_vencimiento);

                return { ...t, stats: { canchas, reservas, clientes }, dias_restantes: diasRestantes };
            } catch (e) {
                return { ...t, stats: { canchas: 0, reservas: 0, clientes: 0 }, dias_restantes: null };
            }
        }));

        // Filtrar por_vencer en JS (más preciso)
        let filtered = tenantsWithStats;
        if (estado === 'por_vencer') {
            filtered = tenantsWithStats.filter(t => t.dias_restantes !== null && t.dias_restantes >= 0 && t.dias_restantes <= 7);
        } else if (estado === 'vencidos') {
            filtered = tenantsWithStats.filter(t => t.dias_restantes !== null && t.dias_restantes < 0);
        }

        res.json({ data: filtered });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Aprobar tenant (onboarding automático) ────────────────────────────────────
const approveTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { meses = 1 } = req.body;

        const result = await executeQuery(`SELECT * FROM tenants WHERE id = ${parseInt(id)}`);
        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'Tenant no encontrado' });
        }
        const tenant = result[0];

        // Calcular vencimiento
        const vence = new Date();
        vence.setMonth(vence.getMonth() + parseInt(meses));
        const fechaVenc = vence.toISOString();

        // Activar tenant
        await executeQuery(`
            UPDATE tenants SET estado = 'activo', fecha_vencimiento = '${fechaVenc}'
            WHERE id = ${tenant.id}
        `);

        // Onboarding: crear ajustes del complejo para este tenant
        const ajustesExist = await executeQuery(`SELECT COUNT(*) as count FROM ajustes_complejo WHERE tenant_id = ${tenant.id}`);
        const countAj = Array.isArray(ajustesExist) && ajustesExist[0] ? parseInt(ajustesExist[0].count) : 0;
        if (countAj === 0) {
            const safeNombre = String(tenant.nombre).replace(/'/g, "''");
            const safeTel = String(tenant.telefono || '').replace(/'/g, "''");
            const safeUbic = String(tenant.ubicacion || '').replace(/'/g, "''");
            // Use a computed id: tenant.id + 100 to avoid collision with legacy id=1
            const ajusteId = 100 + tenant.id;
            await executeQuery(`
                INSERT INTO ajustes_complejo (id, tenant_id, nombre_complejo, open_time, close_time, wpp_contacto, ubicacion_maps)
                VALUES (${ajusteId}, ${tenant.id}, '${safeNombre}', '08:00', '23:00', '${safeTel}', '${safeUbic}')
            `);
        }

        // Onboarding: crear una cancha vacía inicial
        const canchasExist = await executeQuery(`SELECT COUNT(*) as count FROM canchas WHERE tenant_id = ${tenant.id}`);
        const countC = Array.isArray(canchasExist) && canchasExist[0] ? parseInt(canchasExist[0].count) : 0;
        if (countC === 0) {
            await executeQuery(`
                INSERT INTO canchas (tenant_id, nombre, deporte, descripcion, precioPorHora, estado, colorTag, porcentaje_sena)
                VALUES (${tenant.id}, 'Mi Primera Cancha', 'Fútbol 5', 'Configurá esta cancha desde el panel de administración.', 0, 'disponible', 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', 50)
            `);
        }

        // Onboarding: crear usuario admin para este tenant
        const adminExist = await executeQuery(`SELECT COUNT(*) as count FROM admin_users WHERE tenant_id = ${tenant.id}`);
        const countA = Array.isArray(adminExist) && adminExist[0] ? parseInt(adminExist[0].count) : 0;
        if (countA === 0) {
            const safeSlug = String(tenant.slug).replace(/'/g, "''");
            await executeQuery(`
                INSERT INTO admin_users (username, password_hash, tenant_id)
                VALUES ('${safeSlug}', '${String(tenant.password_hash).replace(/'/g, "''")}', ${tenant.id})
            `);
        }

        res.json({ message: `Tenant aprobado y activado por ${meses} mes(es). Vence: ${fechaVenc}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Suspender tenant ──────────────────────────────────────────────────────────
const suspendTenant = async (req, res) => {
    try {
        const { id } = req.params;
        await executeQuery(`UPDATE tenants SET estado = 'suspendido' WHERE id = ${parseInt(id)}`);
        res.json({ message: 'Tenant suspendido' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Activar / Re-activar tenant ──────────────────────────────────────────────
const activateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        await executeQuery(`UPDATE tenants SET estado = 'activo' WHERE id = ${parseInt(id)}`);
        res.json({ message: 'Tenant activado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Renovar meses de un tenant ───────────────────────────────────────────────
const renewTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { meses = 1 } = req.body;

        const result = await executeQuery(`SELECT fecha_vencimiento, estado FROM tenants WHERE id = ${parseInt(id)}`);
        if (!result || result.length === 0) return res.status(404).json({ error: 'Tenant no encontrado' });

        const tenant = result[0];
        // Si ya venció, extender desde hoy; si sigue vigente, extender desde la fecha actual
        const base = tenant.fecha_vencimiento && new Date(tenant.fecha_vencimiento) > new Date()
            ? new Date(tenant.fecha_vencimiento)
            : new Date();

        base.setMonth(base.getMonth() + parseInt(meses));
        const nuevaFecha = base.toISOString();

        await executeQuery(`
            UPDATE tenants SET fecha_vencimiento = '${nuevaFecha}', estado = 'activo'
            WHERE id = ${parseInt(id)}
        `);

        res.json({ message: `+${meses} mes(es) añadido(s). Nuevo vencimiento: ${nuevaFecha}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Renovar +30 días a todos los tenants activos ────────────────────────────
const renewAllTenants = async (req, res) => {
    try {
        const tenants = await executeQuery(`SELECT id, fecha_vencimiento FROM tenants WHERE estado = 'activo'`);
        if (!tenants || tenants.length === 0) return res.json({ message: 'No hay tenants activos', updated: 0 });

        let updated = 0;
        for (const t of tenants) {
            const base = t.fecha_vencimiento && new Date(t.fecha_vencimiento) > new Date()
                ? new Date(t.fecha_vencimiento)
                : new Date();
            base.setDate(base.getDate() + 30);
            await executeQuery(`UPDATE tenants SET fecha_vencimiento = '${base.toISOString()}' WHERE id = ${t.id}`);
            updated++;
        }

        res.json({ message: `+30 días añadidos a ${updated} tenants activos.`, updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── Impersonar tenant (acceso directo al panel desde super admin) ─────────────
const impersonateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery(`SELECT id, slug, nombre, estado FROM tenants WHERE id = ${parseInt(id)}`);
        if (!result || result.length === 0) return res.status(404).json({ error: 'Tenant no encontrado' });

        const tenant = result[0];
        // Generar token de acceso para ese tenant (sin necesitar contraseña)
        const token = Buffer.from(`tenant:${tenant.id}:${tenant.slug}:${Date.now()}`).toString('base64');

        res.json({
            token,
            tenant: { id: tenant.id, nombre: tenant.nombre, slug: tenant.slug }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    registerTenant,
    loginTenant,
    loginSuperAdmin,
    listTenants,
    approveTenant,
    suspendTenant,
    activateTenant,
    renewTenant,
    renewAllTenants,
    impersonateTenant,
    superCreateTenant
};
