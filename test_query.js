require('dotenv').config();
const { executeQuery, sqlEscape } = require('./config/db');
(async () => {
    try {
        const q = `SELECT id, slug FROM tenants`;
        const res = await executeQuery(q);
        console.log("RES:", res);
    } catch(e) {
        console.error(e);
    }
})();
