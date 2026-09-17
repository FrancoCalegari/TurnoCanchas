require('dotenv').config();
const { executeQuery } = require('./config/db');
async function test() {
    const rows = await executeQuery("SELECT id, slug FROM tenants");
    console.log(rows);
}
test();
