const { executeQuery } = require('./config/db');
require('dotenv').config();
(async () => {
    try {
        const res = await executeQuery("SELECT column_name FROM information_schema.columns WHERE table_name = 'clientes'");
        console.log(res);
    } catch(e) { console.error(e); }
})();
