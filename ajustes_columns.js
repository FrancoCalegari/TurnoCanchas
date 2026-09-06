const { executeQuery } = require('./config/db');
const columns = [
    "ALTER TABLE ajustes_complejo ADD COLUMN info_wifi_ssid VARCHAR(100)",
    "ALTER TABLE ajustes_complejo ADD COLUMN info_wifi_pass VARCHAR(100)",
    "ALTER TABLE ajustes_complejo ADD COLUMN info_buffet VARCHAR(255)",
    "ALTER TABLE ajustes_complejo ADD COLUMN info_reglas TEXT"
];
async function run() {
    for (const sql of columns) {
        try { await executeQuery(sql); console.log("Success:", sql); } 
        catch (e) { console.log("Skipping:", sql, e.message); }
    }
}
run();
