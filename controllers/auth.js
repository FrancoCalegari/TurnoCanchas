const { executeQuery } = require('../config/db');
const bcrypt = require('bcryptjs');

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
        const { nombre, email, password, telefono, acepta_terminos } = req.body;
        
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, email, password)' });
        }

        if (!acepta_terminos) {
            return res.status(400).json({ error: 'Debes aceptar los Términos y Condiciones para registrarte.' });
        }

        const safeNombre = String(nombre).replace(/'/g, "''");
        const safeEmail = String(email).replace(/'/g, "''").toLowerCase();
        const safeTelefono = telefono ? String(telefono).replace(/'/g, "''") : '';

        // Verificar si el email ya existe
        const existing = await executeQuery(`SELECT id FROM clientes WHERE email = '${safeEmail}'`);
        if (existing && existing.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Hashear la contraseña con bcryptjs
        const hashedPassword = await bcrypt.hash(String(password), SALT_ROUNDS);
        const safeHash = hashedPassword.replace(/'/g, "''");

        const query = `
            INSERT INTO clientes (nombre, email, password, telefono) 
            VALUES ('${safeNombre}', '${safeEmail}', '${safeHash}', '${safeTelefono}')
        `;
        
        await executeQuery(query);
        
        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const loginClient = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Faltan credenciales' });
        }

        const safeEmail = String(email).replace(/'/g, "''").toLowerCase();
        const query = `SELECT * FROM clientes WHERE email = '${safeEmail}'`;
        
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

module.exports = {
    login,
    masterLogin,
    registerClient,
    loginClient
};
