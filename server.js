require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Servir archivos estáticos (Frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Rutas explícitas para Vercel
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta dinámica para el portal del tenant — valida existencia y estado
app.get('/t/:slug', async (req, res) => {
    try {
        const { executeQuery } = require('./config/db');
        const safeSlug = String(req.params.slug).replace(/[^a-z0-9-]/gi, '').toLowerCase();
        const result = await executeQuery(`SELECT estado FROM tenants WHERE slug = '${safeSlug}'`);
        if (!result || result.length === 0 || result[0].estado !== 'activo') {
            return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
        }
        res.sendFile(path.join(__dirname, 'public', 'portal.html'));
    } catch (err) {
        console.error('[/t/:slug]', err.message);
        res.status(500).send('Error interno del servidor');
    }
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/masteradmin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'masteradmin.html'));
});

app.get('/register-tenant', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register-tenant.html'));
});

app.get('/terminosycondiciones', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'terminosycondiciones.html'));
});

// Rutas de la API
app.use('/api', routes);

// Manejo de errores (Middleware global)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal en el servidor.' });
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Servidor de TurnoCanchas corriendo en el puerto ${PORT}`);
    });
}

module.exports = app;
