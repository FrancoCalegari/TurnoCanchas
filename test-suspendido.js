require('dotenv').config();
const { executeQuery } = require('./config/db');

async function test() {
    try {
        const result = await executeQuery("SELECT id, slug, estado, fecha_vencimiento FROM tenants");
        console.log("Tenants:", result);
    } catch (err) {
        console.error("Failed:", err.message);
    }
}
test();
