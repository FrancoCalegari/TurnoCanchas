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

// Ruta dinámica para el portal del tenant
app.get('/t/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'portal.html'));
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

// Rutas de la API
app.use('/api', routes);

// Manejo de errores (Middleware global)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal en el servidor.' });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Servidor de TurnoCanchas corriendo en el puerto ${PORT}`);
    });
}

module.exports = app;
