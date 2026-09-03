const { executeQuery } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../utils/mailer');

const SALT_ROUNDS = 10;

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Faltan credenciales' });
        }

        const safeUser = String(username).replace(/'/g, "''");
        const query = `SELECT * FROM admin_users WHERE username = '${safeUser}'`;
        
        const result = await executeQuery(query);
        
        if (!result || result.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const user = result[0];
        
        // Comparación simple para admin (sin bcrypt por compatibilidad con datos existentes)
        if (user.password_hash === password) {
            const fakeToken = Buffer.from(`${user.username}:${Date.now()}`).toString('base64');
            res.json({ token: fakeToken, username: user.username });
        } else {
            res.status(401).json({ error: 'Contraseña incorrecta' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const masterLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Faltan credenciales' });
        }

        // Fallback a env vars para retrocompatibilidad
        const envUser = process.env.masteruser;
        const envPass = process.env.masterpass;

        if (username === envUser && password === envPass) {
            const fakeToken = Buffer.from(`superadmin:${username}:${Date.now()}`).toString('base64');
            res.json({ token: fakeToken, username: envUser });
            return;
        }

        // Buscar en la tabla super_admins
        const safeUser = String(username).replace(/'/g, "''");
        const result = await executeQuery(`SELECT * FROM super_admins WHERE username = '${safeUser}'`);
        if (!result || result.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const admin = result[0];
        const match = await bcrypt.compare(String(password), admin.password_hash);
        if (!match) return res.status(401).json({ error: 'Credenciales inválidas' });

        const token = Buffer.from(`superadmin:${admin.username}:${Date.now()}`).toString('base64');
        res.json({ token, username: admin.username });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const registerClient = async (req, res) => {
    try {
        const { nombre, email, password, telefono, acepta_terminos, tenant } = req.body;
        
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, email, password)' });
        }

        if (!acepta_terminos) {
            return res.status(400).json({ error: 'Debes aceptar los Términos y Condiciones para registrarte.' });
        }

        const safeNombre = String(nombre).replace(/'/g, "''");
        const safeEmail = String(email).replace(/'/g, "''").toLowerCase();
        const safeTelefono = telefono ? String(telefono).replace(/'/g, "''") : '';
        
        let tenantId = 0;
        if (tenant) {
            const safeTenant = String(tenant).replace(/'/g, "''");
            const tRes = await executeQuery(`SELECT id FROM tenants WHERE slug = '${safeTenant}'`);
            if (tRes && tRes.length > 0) tenantId = tRes[0].id;
        }

        // Verificar si el email ya existe en este tenant
        const existing = await executeQuery(`SELECT id FROM clientes WHERE email = '${safeEmail}' AND tenant_id = ${tenantId}`);
        if (existing && existing.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado en este complejo' });
        }

        // Hashear la contraseña con bcryptjs
        const hashedPassword = await bcrypt.hash(String(password), SALT_ROUNDS);
        const safeHash = hashedPassword.replace(/'/g, "''");

        const query = `
            INSERT INTO clientes (nombre, email, password, telefono, tenant_id) 
            VALUES ('${safeNombre}', '${safeEmail}', '${safeHash}', '${safeTelefono}', ${tenantId})
        `;
        
        await executeQuery(query);
        
        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const loginClient = async (req, res) => {
    try {
        const { email, password, tenant } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Faltan credenciales' });
        }
        
        let tenantId = 0;
        if (tenant) {
            const safeTenant = String(tenant).replace(/'/g, "''");
            const tRes = await executeQuery(`SELECT id FROM tenants WHERE slug = '${safeTenant}'`);
            if (tRes && tRes.length > 0) tenantId = tRes[0].id;
        }

        const safeEmail = String(email).replace(/'/g, "''").toLowerCase();
        const query = `SELECT * FROM clientes WHERE email = '${safeEmail}' AND tenant_id = ${tenantId}`;
        
        const result = await executeQuery(query);
        
        if (!result || result.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const user = result[0];
        const storedPassword = user.password;

        // Soporte para contraseñas antiguas (plain text) y nuevas (bcrypt hash)
        let passwordMatch = false;
        if (storedPassword && storedPassword.startsWith('$2')) {
            // Es un hash bcrypt
            passwordMatch = await bcrypt.compare(String(password), storedPassword);
        } else {
            // Contraseña en plain text (legacy) — comparación directa
            passwordMatch = (storedPassword === password);
            // Aprovechar para migrar a hash
            if (passwordMatch) {
                const newHash = await bcrypt.hash(String(password), SALT_ROUNDS);
                const safeHash = newHash.replace(/'/g, "''");
                await executeQuery(`UPDATE clientes SET password = '${safeHash}' WHERE id = ${user.id}`);
            }
        }

        if (passwordMatch) {
            const token = Buffer.from(`client:${user.id}:${Date.now()}`).toString('base64');
            delete user.password;
            res.json({ token, user });
        } else {
            res.status(401).json({ error: 'Contraseña incorrecta' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const forgotPasswordClient = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'El email es requerido' });

        const safeEmail = String(email).replace(/'/g, "''").toLowerCase();
        
        // Verificar si el email existe
        const result = await executeQuery(`SELECT * FROM clientes WHERE email = '${safeEmail}'`);
        if (!result || result.length === 0) {
            // Se responde éxito igual por seguridad (evitar enumeración)
            return res.json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación.' });
        }

        const user = result[0];
        
        // Generar token
        const token = crypto.randomBytes(32).toString('hex');
        
        // Fecha de expiración (1 hora)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        const expiresIso = expiresAt.toISOString().replace('T', ' ').substring(0, 19);

        // Guardar token
        await executeQuery(`
            INSERT INTO password_resets (email, token, expires_at) 
            VALUES ('${safeEmail}', '${token}', '${expiresIso}')
        `);

        // Enviar correo
        const protocol = req.protocol || 'http';
        const host = req.get('host');
        const resetLink = `${protocol}://${host}/reset-password.html?token=${token}`;
        
        const emailHtml = \`
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #333;">Recuperación de Contraseña</h2>
                <p>Hola \${user.nombre},</p>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="\${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Restablecer mi contraseña</a>
                </div>
                <p style="color: #666; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                <p style="color: #666; font-size: 14px;">El enlace expirará en 1 hora.</p>
            </div>
        \`;

        await sendEmail({
            to: user.email,
            subject: 'Recuperación de Contraseña - TurnoCanchas',
            html: emailHtml
        });

        res.json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación.' });
    } catch (error) {
        console.error("Error en forgotPasswordClient:", error);
        res.status(500).json({ error: 'Ocurrió un error al procesar la solicitud' });
    }
};

const resetPasswordClient = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        const safeToken = String(token).replace(/'/g, "''");
        
        // Buscar el token en DB
        const result = await executeQuery(\`
            SELECT * FROM password_resets 
            WHERE token = '\${safeToken}' 
            ORDER BY createdAt DESC LIMIT 1
        \`);

        if (!result || result.length === 0) {
            return res.status(400).json({ error: 'El enlace de recuperación es inválido o ha expirado.' });
        }

        const resetRecord = result[0];
        
        // Validar expiración
        const now = new Date();
        const expiresAt = new Date(resetRecord.expires_at);
        if (now > expiresAt) {
            return res.status(400).json({ error: 'El enlace de recuperación ha expirado.' });
        }

        // Encontrar cliente por email
        const safeEmail = resetRecord.email.replace(/'/g, "''");
        const clientResult = await executeQuery(\`SELECT id FROM clientes WHERE email = '\${safeEmail}' LIMIT 1\`);
        
        if (!clientResult || clientResult.length === 0) {
            return res.status(404).json({ error: 'No se encontró el usuario asociado.' });
        }
        
        const clientId = clientResult[0].id;

        // Actualizar contraseña
        const hashedPassword = await bcrypt.hash(String(newPassword), SALT_ROUNDS);
        const safeHash = hashedPassword.replace(/'/g, "''");
        
        await executeQuery(\`UPDATE clientes SET password = '\${safeHash}' WHERE id = \${clientId}\`);

        // Invalidar el token para que no se re-utilice
        await executeQuery(\`DELETE FROM password_resets WHERE token = '\${safeToken}'\`);

        res.json({ message: 'Contraseña actualizada con éxito. Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error("Error en resetPasswordClient:", error);
        res.status(500).json({ error: 'Ocurrió un error al procesar la solicitud' });
    }
};

module.exports = {
    login,
    masterLogin,
    registerClient,
    loginClient,
    forgotPasswordClient,
    resetPasswordClient
};
