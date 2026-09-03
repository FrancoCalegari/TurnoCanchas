require('dotenv').config();
const { executeQuery } = require('../config/db');

async function migrate() {
    try {
        console.log("Creando tabla password_resets...");
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id SERIAL PRIMARY KEY,
                email VARCHAR(100) NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Tabla password_resets creada.");
        process.exit(0);
    } catch (e) {
        console.error("Error en migración:", e.message);
        process.exit(1);
    }
}

migrate();
