require('dotenv').config();
const { executeQuery } = require('./config/db');

async function main() {
    try {
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id SERIAL PRIMARY KEY,
                tenant_id INT NOT NULL DEFAULT 0,
                cliente_id INT,
                admin_id INT,
                subscription TEXT NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table created");
    } catch (e) {
        console.error(e);
    }
}
main();
