require('dotenv').config();
const { executeQuery } = require('./config/db');

async function test() {
    try {
        const result = await executeQuery("SELECT id, slug, estado FROM tenants LIMIT 1");
        console.log("Success:", result);
    } catch (err) {
        console.error("Failed:", err.message);
    }
}
test();
