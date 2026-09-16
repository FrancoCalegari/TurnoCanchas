require('dotenv').config();
const { executeQuery, sqlEscape } = require('./config/db');

async function test() {
    try {
        const id = 'RES-TEST'; // Asumimos que no existe pero no importa, la query no debería fallar por sintaxis
        const status = 'confirmada';
        const tenantFilter = `AND tenant_id = 1`;
        
        const q = `UPDATE reservas SET estado = ${sqlEscape(status)} WHERE id = ${sqlEscape(id)} ${tenantFilter}`;
        console.log("Query:", q);
        const res = await executeQuery(q);
        console.log("Result:", res);
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
