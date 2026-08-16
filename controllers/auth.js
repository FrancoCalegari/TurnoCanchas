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

module.exports = {
    login,
    masterLogin
};
