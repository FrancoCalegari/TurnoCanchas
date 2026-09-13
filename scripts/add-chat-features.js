require('dotenv').config();
const { executeQuery } = require('../config/db');

async function run() {
    try {
        console.log('--- Migración: Añadiendo funciones de Chat y Push ---');
        
        // 1. Alter table mensajes
        console.log('Alterando tabla mensajes...');
        const alters = [
            "ALTER TABLE mensajes ADD COLUMN sender_type VARCHAR(20) DEFAULT 'cliente';",
            "ALTER TABLE mensajes ADD COLUMN file_url VARCHAR(500);"
        ];
        
        for (const sql of alters) {
            try { 
                await executeQuery(sql); 
                console.log(`Ejecutado: ${sql}`);
            } catch(e) {
                console.log(`Nota: Posiblemente ya existe. (${e.message})`);
            }
        }

        // 2. Create push_subscriptions table
        console.log('Creando tabla push_subscriptions...');
        const createPush = `
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id SERIAL PRIMARY KEY,
                tenant_id INT NOT NULL DEFAULT 0,
                cliente_id INT,
                admin_id INT,
                subscription JSON NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await executeQuery(createPush);
        console.log('Tabla push_subscriptions creada con éxito.');
        
        console.log('--- Migración completada ---');
    } catch (err) {
        console.error('Error en migración:', err);
    } finally {
        process.exit();
    }
}

run();
