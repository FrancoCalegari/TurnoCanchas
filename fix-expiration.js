require('dotenv').config();
const { executeQuery } = require('./config/db');

async function fix() {
    try {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        
        const query = `UPDATE plataforma_config SET fecha_vencimiento = '${nextYear.toISOString()}', estado = 'activo' WHERE id = 1`;
        await executeQuery(query);
        console.log("Success: Platform expiration extended to", nextYear.toISOString());
    } catch (err) {
        console.error("Failed:", err.message);
    }
}
fix();
