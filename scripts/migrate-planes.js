require('dotenv').config();
const { executeQuery } = require('../config/db');

async function migratePlanes() {
    try {
        console.log("Creando tabla planes...");
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS planes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                precio INT NOT NULL,
                caracteristicas TEXT,
                activo BOOLEAN DEFAULT 1
            )
        `);
        console.log("Tabla planes creada exitosamente.");

        // Verificar si ya existe un plan para no duplicarlo
        const countRes = await executeQuery("SELECT COUNT(*) as count FROM planes");
        const count = Array.isArray(countRes) && countRes[0] ? parseInt(countRes[0].count) : 0;
        
        if (count === 0) {
            console.log("Insertando plan por defecto (Plan Actual)...");
            await executeQuery(`
                INSERT INTO planes (nombre, precio, caracteristicas)
                VALUES ('Plan Premium', 45000, 'Panel de control completo, Gestión ilimitada de clientes, Sistema de Turnos y Reservas, PWA (App Instalable), Soporte técnico prioritario')
            `);
            console.log("Plan por defecto insertado.");
        } else {
            console.log("La tabla planes ya contiene registros. Omitiendo inserción.");
        }

        console.log("Migración completada.");
        process.exit(0);
    } catch (e) {
        console.error("Error en migración:", e.message);
        process.exit(1);
    }
}

migratePlanes();
