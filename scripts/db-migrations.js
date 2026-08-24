require('dotenv').config();
const { executeQuery } = require('../config/db');

async function migrate() {
    try {
        console.log("Creando tabla rubros...");
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS rubros (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                descripcion TEXT,
                activo BOOLEAN DEFAULT 1
            )
        `);
        console.log("Tabla rubros creada.");

        console.log("Insertando rubro por defecto (Deportes)...");
        await executeQuery(`
            INSERT INTO rubros (nombre, descripcion)
            VALUES ('Deportes', 'Complejos deportivos, canchas, etc.')
        `);
        console.log("Rubro insertado.");

        console.log("Añadiendo rubro_id a tenants...");
        // This might fail if the column already exists, but we catch errors if so.
        try {
            await executeQuery(`
                ALTER TABLE tenants ADD COLUMN rubro_id INT DEFAULT 1
            `);
            console.log("Columna añadida.");
        } catch (e) {
            console.log("Columna rubro_id podría ya existir o error:", e.message);
        }

        console.log("Migración completada.");
    } catch (e) {
        console.error("Error en migración:", e.message);
    }
}

migrate();
