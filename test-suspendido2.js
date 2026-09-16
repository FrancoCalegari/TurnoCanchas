require('dotenv').config();
const { executeQuery } = require('./config/db');

async function test() {
    try {
        const result = await executeQuery("SELECT * FROM plataforma_config");
        console.log("Plataforma:", result);
    } catch (err) {
        console.error("Failed:", err.message);
    }
}
test();
