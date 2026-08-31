require('dotenv').config({ path: '../.env' });
const { executeQuery } = require('../config/db');

async function run() {
    try {
        console.log('Creando tabla mensajes...');
        const createMensajes = `
            CREATE TABLE IF NOT EXISTS mensajes (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER,
                cliente_id INTEGER,
                admin_id INTEGER,
                reserva_id VARCHAR(50),
                asunto VARCHAR(255),
                mensaje TEXT NOT NULL,
                leido BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await executeQuery(createMensajes);
        console.log('Tabla mensajes creada con éxito.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

run();
