const { executeQuery } = require('../config/db');

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
        
        // Comparación simple para el demo. En prod usar bcrypt.compare
        if (user.password_hash === password) {
            // Retornamos un token simple para uso en el frontend
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

        const envUser = process.env.masteruser;
        const envPass = process.env.masterpass;

        if (username === envUser && password === envPass) {
            const fakeToken = Buffer.from(`master:${Date.now()}`).toString('base64');
            res.json({ token: fakeToken, username: envUser });
        } else {
            res.status(401).json({ error: 'Credenciales inválidas' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const registerClient = async (req, res) => {
    try {
        const { nombre, email, password, telefono } = req.body;
        
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, email, password)' });
        }

        const safeNombre = String(nombre).replace(/'/g, "''");
        const safeEmail = String(email).replace(/'/g, "''").toLowerCase();
        const safePassword = String(password).replace(/'/g, "''"); // In a real app, hash this!
        const safeTelefono = telefono ? String(telefono).replace(/'/g, "''") : '';

        // Check if email exists
        const existing = await executeQuery(`SELECT id FROM clientes WHERE email = '${safeEmail}'`);
        if (existing && existing.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const query = `
            INSERT INTO clientes (nombre, email, password, telefono) 
            VALUES ('${safeNombre}', '${safeEmail}', '${safePassword}', '${safeTelefono}')
            RETURNING id, nombre, email, telefono
        `;
        
        const result = await executeQuery(query);
        // Sometimes RETURNING might not work perfectly with custom drivers, so we just assume success if it doesn't throw
        
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
        
        if (user.password === password) {
            const token = Buffer.from(`client:${user.id}:${Date.now()}`).toString('base64');
            // Remove password before sending to client
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
