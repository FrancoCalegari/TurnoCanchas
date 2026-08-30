require('dotenv').config();
const { executeQuery } = require('./config/db');

async function test() {
    try {
        const tenants = await executeQuery('SELECT id, email, password_hash, rubro_id FROM tenants LIMIT 1');
        console.log('Tenants:', tenants);
    } catch (e) {
        console.error(e);
    }
}
test();
